# My Wallet Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add My Wallet v1 to `/calc` so users can manually save and later restore their selected cards, active benefit-plan state, runtime fields, and custom exchange-rate overrides from local storage.

**Architecture:** Keep `CalcPage` as the single owner of `/calc` state, and add a thin persistence layer around it instead of introducing a global store. Put the fragile parts, including snapshot validation, storage parsing, and auto-select gating, into small pure utilities with Vitest coverage; keep UI concerns in a focused wallet control component.

**Tech Stack:** React 19 / TypeScript 5.9 / Vite 8 / Vitest / Tailwind CSS 4 / browser `localStorage`

> Status as of 2026-04-10: implementation landed in `cardsense-web` at `e5a926c` (`feat: add my wallet mode to calc`). I re-ran `npx vitest run src/pages/calc/my-wallet-storage.test.ts src/pages/calc/my-wallet-auto-select.test.ts src/pages/calc/buildCalcRecommendationRequest.test.ts`, `npx eslint src/pages/CalcPage.tsx src/pages/calc/MyWalletPanel.tsx src/pages/calc/my-wallet-storage.ts src/pages/calc/my-wallet-auto-select.ts`, and `npx tsc -b`; all passed. Browser/manual verification is still pending.

---

## File Structure

- Create: `cardsense-web/src/pages/calc/my-wallet-storage.ts`
  Own the storage key, snapshot type, JSON parsing, validation, sanitization, and snapshot building.
- Create: `cardsense-web/src/pages/calc/my-wallet-storage.test.ts`
  Lock in storage parsing, filtering, and snapshot-shape behavior.
- Create: `cardsense-web/src/pages/calc/my-wallet-auto-select.ts`
  Hold the rule that decides whether `/calc` should keep running catalog auto-select after wallet restore.
- Create: `cardsense-web/src/pages/calc/my-wallet-auto-select.test.ts`
  Lock in the wallet-aware auto-select rules.
- Create: `cardsense-web/src/pages/calc/MyWalletPanel.tsx`
  Render wallet status, save, and clear controls as a small presentational component.
- Modify: `cardsense-web/src/pages/CalcPage.tsx`
  Load the wallet on mount, save and clear snapshots, show restore status, and prevent auto-select from overwriting a restored wallet.

---

### Task 1: Build The Wallet Storage Utilities

**Files:**
- Create: `cardsense-web/src/pages/calc/my-wallet-storage.ts`
- Test: `cardsense-web/src/pages/calc/my-wallet-storage.test.ts`

- [x] **Step 1: Write the failing storage tests**

Create `cardsense-web/src/pages/calc/my-wallet-storage.test.ts` with these cases:

```ts
import { describe, expect, it } from 'vitest'
import {
  MY_WALLET_STORAGE_KEY,
  buildMyWalletSnapshot,
  parseStoredMyWalletSnapshot,
} from './my-wallet-storage'

describe('parseStoredMyWalletSnapshot', () => {
  it('returns null for invalid JSON', () => {
    expect(parseStoredMyWalletSnapshot('{')).toBeNull()
  })

  it('filters invalid cards, plan runtime, and exchange rate values', () => {
    expect(
      parseStoredMyWalletSnapshot(
        JSON.stringify({
          version: 1,
          savedAt: '2026-04-10T00:00:00.000Z',
          selectedCards: ['CARD_A', 123, 'CARD_B'],
          activePlansByCard: { CARD_A: 'PLAN_A', CARD_B: 123 },
          planRuntimeByCard: {
            CARD_A: { tier: 'LEVEL_1', bad: 3 },
            CARD_B: 'oops',
          },
          customExchangeRates: {
            'POINTS.ESUN': 0.8,
            'MILES._DEFAULT': -1,
            BAD: 'oops',
          },
        }),
      ),
    ).toEqual({
      version: 1,
      savedAt: '2026-04-10T00:00:00.000Z',
      selectedCards: ['CARD_A', 'CARD_B'],
      activePlansByCard: { CARD_A: 'PLAN_A' },
      planRuntimeByCard: { CARD_A: { tier: 'LEVEL_1' } },
      customExchangeRates: { 'POINTS.ESUN': 0.8 },
    })
  })
})

describe('buildMyWalletSnapshot', () => {
  it('builds a versioned snapshot with the current calc state', () => {
    expect(
      buildMyWalletSnapshot({
        selectedCards: ['CARD_A', 'CARD_B'],
        activePlansByCard: { CARD_A: 'PLAN_A' },
        planRuntimeByCard: { CARD_A: { tier: 'LEVEL_1' } },
        customExchangeRates: { 'POINTS.ESUN': 0.8 },
        savedAt: '2026-04-10T12:00:00.000Z',
      }),
    ).toEqual({
      version: 1,
      savedAt: '2026-04-10T12:00:00.000Z',
      selectedCards: ['CARD_A', 'CARD_B'],
      activePlansByCard: { CARD_A: 'PLAN_A' },
      planRuntimeByCard: { CARD_A: { tier: 'LEVEL_1' } },
      customExchangeRates: { 'POINTS.ESUN': 0.8 },
    })
  })
})
```

- [x] **Step 2: Run the storage tests and verify they fail**

Run:

```bash
cd cardsense-web
npx vitest run src/pages/calc/my-wallet-storage.test.ts
```

Expected:

- FAIL because `my-wallet-storage.ts` does not exist yet

- [x] **Step 3: Implement the storage module**

Create `cardsense-web/src/pages/calc/my-wallet-storage.ts` with a small, testable API:

```ts
export const MY_WALLET_STORAGE_KEY = 'cardsense.my-wallet.v1'

export interface MyWalletSnapshot {
  version: 1
  savedAt: string
  selectedCards: string[]
  activePlansByCard: Record<string, string>
  planRuntimeByCard: Record<string, Record<string, string>>
  customExchangeRates: Record<string, number>
}

export function parseStoredMyWalletSnapshot(raw: string | null): MyWalletSnapshot | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (parsed.version !== 1 || typeof parsed.savedAt !== 'string') return null

    return {
      version: 1,
      savedAt: parsed.savedAt,
      selectedCards: Array.isArray(parsed.selectedCards)
        ? parsed.selectedCards.filter((value): value is string => typeof value === 'string')
        : [],
      activePlansByCard: filterStringRecord(parsed.activePlansByCard),
      planRuntimeByCard: filterNestedStringRecord(parsed.planRuntimeByCard),
      customExchangeRates: filterNumericRecord(parsed.customExchangeRates),
    }
  } catch {
    return null
  }
}

export function buildMyWalletSnapshot(input: Omit<MyWalletSnapshot, 'version'>): MyWalletSnapshot {
  return { version: 1, ...input }
}
```

Add helpers in the same file:

```ts
function filterStringRecord(value: unknown): Record<string, string> { /* keep only string values */ }
function filterNestedStringRecord(value: unknown): Record<string, Record<string, string>> { /* keep only nested string fields */ }
function filterNumericRecord(value: unknown): Record<string, number> { /* keep only finite, non-negative numbers */ }
```

- [x] **Step 4: Re-run the storage tests**

Run:

```bash
cd cardsense-web
npx vitest run src/pages/calc/my-wallet-storage.test.ts
```

Expected:

- PASS

- [x] **Step 5: Run type-check for the new utility**

Run:

```bash
cd cardsense-web
npx tsc -b
```

Expected:

- PASS

- [x] **Step 6: Commit the storage utilities**

```bash
cd cardsense-web
git add src/pages/calc/my-wallet-storage.ts src/pages/calc/my-wallet-storage.test.ts
git commit -m "feat: add my wallet storage utilities"
```

---

### Task 2: Add Wallet-Aware Auto-Select Rules

**Files:**
- Create: `cardsense-web/src/pages/calc/my-wallet-auto-select.ts`
- Test: `cardsense-web/src/pages/calc/my-wallet-auto-select.test.ts`

- [x] **Step 1: Write the failing auto-select rule tests**

Create `cardsense-web/src/pages/calc/my-wallet-auto-select.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { shouldRunWalletAutoSelect } from './my-wallet-auto-select'

describe('shouldRunWalletAutoSelect', () => {
  it('returns false when a restored wallet already has at least two cards', () => {
    expect(
      shouldRunWalletAutoSelect({
        hasRestoredWallet: true,
        selectedCardCount: 2,
      }),
    ).toBe(false)
  })

  it('returns true when no wallet was restored', () => {
    expect(
      shouldRunWalletAutoSelect({
        hasRestoredWallet: false,
        selectedCardCount: 0,
      }),
    ).toBe(true)
  })

  it('returns true when the restored wallet has fewer than two cards', () => {
    expect(
      shouldRunWalletAutoSelect({
        hasRestoredWallet: true,
        selectedCardCount: 1,
      }),
    ).toBe(true)
  })
})
```

- [x] **Step 2: Run the auto-select tests and verify they fail**

Run:

```bash
cd cardsense-web
npx vitest run src/pages/calc/my-wallet-auto-select.test.ts
```

Expected:

- FAIL because `my-wallet-auto-select.ts` does not exist yet

- [x] **Step 3: Implement the auto-select helper**

Create `cardsense-web/src/pages/calc/my-wallet-auto-select.ts`:

```ts
interface WalletAutoSelectInput {
  hasRestoredWallet: boolean
  selectedCardCount: number
}

export function shouldRunWalletAutoSelect({
  hasRestoredWallet,
  selectedCardCount,
}: WalletAutoSelectInput) {
  if (!hasRestoredWallet) return true
  return selectedCardCount < 2
}
```

- [x] **Step 4: Re-run the auto-select tests**

Run:

```bash
cd cardsense-web
npx vitest run src/pages/calc/my-wallet-auto-select.test.ts
```

Expected:

- PASS

- [x] **Step 5: Run type-check**

Run:

```bash
cd cardsense-web
npx tsc -b
```

Expected:

- PASS

- [x] **Step 6: Commit the auto-select helper**

```bash
cd cardsense-web
git add src/pages/calc/my-wallet-auto-select.ts src/pages/calc/my-wallet-auto-select.test.ts
git commit -m "feat: add wallet-aware auto-select guard"
```

---

### Task 3: Build The My Wallet Control Panel

**Files:**
- Create: `cardsense-web/src/pages/calc/MyWalletPanel.tsx`

- [x] **Step 1: Create the presentational wallet panel**

Create `cardsense-web/src/pages/calc/MyWalletPanel.tsx`:

```tsx
import { Button } from '@/components/ui/button'

interface MyWalletPanelProps {
  selectedCardCount: number
  customRateCount: number
  savedAt: string | null
  hasRestoredWallet: boolean
  statusMessage: string | null
  onSave: () => void
  onClear: () => void
}

export function MyWalletPanel({
  selectedCardCount,
  customRateCount,
  savedAt,
  hasRestoredWallet,
  statusMessage,
  onSave,
  onClear,
}: MyWalletPanelProps) {
  const summary = hasRestoredWallet
    ? `Loaded wallet: ${selectedCardCount} cards, ${customRateCount} custom rates`
    : 'Save your card set, benefit-plan state, and exchange-rate preferences for next time.'

  return (
    <section className="space-y-3 rounded-xl border bg-muted/20 p-4">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold">My Wallet</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">{statusMessage ?? summary}</p>
        {savedAt && (
          <p className="text-[11px] text-muted-foreground">Last saved: {savedAt}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={onSave}>
          Save my wallet
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onClear}>
          Clear wallet
        </Button>
      </div>
    </section>
  )
}
```

- [x] **Step 2: Run a type-check after adding the component**

Run:

```bash
cd cardsense-web
npx tsc -b
```

Expected:

- PASS

- [x] **Step 3: Commit the wallet panel**

```bash
cd cardsense-web
git add src/pages/calc/MyWalletPanel.tsx
git commit -m "feat: add my wallet panel"
```

---

### Task 4: Wire Wallet Load, Save, Clear, And Restore Into `/calc`

**Files:**
- Modify: `cardsense-web/src/pages/CalcPage.tsx`
- Modify: `cardsense-web/src/pages/calc/MyWalletPanel.tsx`
- Use: `cardsense-web/src/pages/calc/my-wallet-storage.ts`
- Use: `cardsense-web/src/pages/calc/my-wallet-auto-select.ts`

- [x] **Step 1: Add wallet state to `CalcPage.tsx`**

Near the existing `useState` declarations, add:

```tsx
const [walletSavedAt, setWalletSavedAt] = useState<string | null>(null)
const [walletStatusMessage, setWalletStatusMessage] = useState<string | null>(null)
const [hasRestoredWallet, setHasRestoredWallet] = useState(false)
```

Import:

```tsx
import { MyWalletPanel } from './calc/MyWalletPanel'
import {
  MY_WALLET_STORAGE_KEY,
  buildMyWalletSnapshot,
  parseStoredMyWalletSnapshot,
} from './calc/my-wallet-storage'
import { shouldRunWalletAutoSelect } from './calc/my-wallet-auto-select'
```

- [x] **Step 2: Add the mount-time restore effect**

Add a `useEffect` that restores local data once cards are available:

```tsx
useEffect(() => {
  if (!cards || cards.length === 0) return

  const snapshot = parseStoredMyWalletSnapshot(localStorage.getItem(MY_WALLET_STORAGE_KEY))
  if (!snapshot) return

  const availableCards = new Set(cards.map((card) => card.cardCode))
  const selected = snapshot.selectedCards.filter((cardCode) => availableCards.has(cardCode))
  const activePlans = Object.fromEntries(
    Object.entries(snapshot.activePlansByCard).filter(([cardCode]) => availableCards.has(cardCode)),
  )
  const runtime = Object.fromEntries(
    Object.entries(snapshot.planRuntimeByCard).filter(([cardCode]) => availableCards.has(cardCode)),
  )

  setSelectedCards(selected)
  setActivePlansByCard(activePlans)
  setPlanRuntimeByCard(runtime)
  setCustomExchangeRates(snapshot.customExchangeRates)
  setWalletSavedAt(snapshot.savedAt)
  setHasRestoredWallet(true)
  setWalletStatusMessage(
    selected.length === snapshot.selectedCards.length
      ? `Loaded your wallet: ${selected.length} cards, ${Object.keys(snapshot.customExchangeRates).length} custom rates`
      : 'Loaded your wallet with some unavailable items removed',
  )
}, [cards])
```

- [x] **Step 3: Gate the auto-select effect with the helper**

Inside the existing auto-select effect, add:

```tsx
if (
  !shouldRunWalletAutoSelect({
    hasRestoredWallet,
    selectedCardCount: selectedCards.length,
  })
) {
  return
}
```

Also add `hasRestoredWallet` and `selectedCards.length` to the dependency list.

- [x] **Step 4: Add save and clear handlers**

Add two callbacks in `CalcPage.tsx`:

```tsx
function handleSaveWallet() {
  const savedAt = new Date().toISOString()
  const snapshot = buildMyWalletSnapshot({
    savedAt,
    selectedCards,
    activePlansByCard,
    planRuntimeByCard,
    customExchangeRates,
  })

  localStorage.setItem(MY_WALLET_STORAGE_KEY, JSON.stringify(snapshot))
  setWalletSavedAt(savedAt)
  setHasRestoredWallet(true)
  setWalletStatusMessage(
    `Saved ${selectedCards.length} cards and ${Object.keys(customExchangeRates).length} custom rates`,
  )
}

function handleClearWallet() {
  localStorage.removeItem(MY_WALLET_STORAGE_KEY)
  setSelectedCards([])
  setActivePlansByCard({})
  setPlanRuntimeByCard({})
  setCustomExchangeRates({})
  setWalletSavedAt(null)
  setHasRestoredWallet(false)
  setWalletStatusMessage('Wallet cleared')
}
```

- [x] **Step 5: Render `MyWalletPanel` between exchange rates and card selector**

Insert:

```tsx
<MyWalletPanel
  selectedCardCount={selectedCards.length}
  customRateCount={Object.keys(customExchangeRates).length}
  savedAt={walletSavedAt}
  hasRestoredWallet={hasRestoredWallet}
  statusMessage={walletStatusMessage}
  onSave={handleSaveWallet}
  onClear={handleClearWallet}
/>
```

Place it directly after:

```tsx
<InlineExchangeRatesPanel onChange={setCustomExchangeRates} />
```

- [x] **Step 6: Run the targeted unit tests**

Run:

```bash
cd cardsense-web
npx vitest run src/pages/calc/my-wallet-storage.test.ts src/pages/calc/my-wallet-auto-select.test.ts src/pages/calc/buildCalcRecommendationRequest.test.ts
```

Expected:

- PASS

- [x] **Step 7: Run lint and type-check**

Run:

```bash
cd cardsense-web
npx eslint src/pages/CalcPage.tsx src/pages/calc/MyWalletPanel.tsx src/pages/calc/my-wallet-storage.ts src/pages/calc/my-wallet-auto-select.ts
npx tsc -b
```

Expected:

- PASS

- [ ] **Step 8: Manually verify the browser behavior**

Run:

```bash
cd cardsense-web
npm run dev
```

Verify:

- Saving after selecting cards writes a wallet snapshot
- Refresh restores selected cards, plan state, runtime fields, and custom exchange rates
- Auto-select no longer overwrites a restored wallet with at least two cards
- Clearing the wallet resets card/plan/rate state but preserves current scenario fields
- If you save only one card, auto-select still runs on reload

- [x] **Step 9: Commit the `/calc` integration**

```bash
cd cardsense-web
git add src/pages/CalcPage.tsx src/pages/calc/MyWalletPanel.tsx
git commit -m "feat: add my wallet mode to calc"
```

---

## Self-Review

### Spec Coverage

- `/calc`-only My Wallet capability: covered in Task 4
- `localStorage` persistence: covered in Task 1 and Task 4
- Saved fields (`selectedCards`, plans, runtime, exchange rates): covered in Tasks 1 and 4
- Manual save and clear UX: covered in Task 3 and Task 4
- Restore feedback messaging: covered in Task 3 and Task 4
- Wallet-aware auto-select behavior: covered in Task 2 and Task 4
- Out-of-scope guard against saving scenario fields: handled by snapshot shape in Task 1

### Placeholder Scan

- No `TODO`, `TBD`, or deferred implementation steps remain
- Every command, file path, and helper name is explicit
- UI verification criteria are concrete

### Type Consistency

- `MyWalletSnapshot` is the only persisted shape
- `selectedCards`, `activePlansByCard`, `planRuntimeByCard`, and `customExchangeRates` match the existing `CalcPage` state names
- `shouldRunWalletAutoSelect` uses `hasRestoredWallet` and `selectedCardCount`, which are defined in Task 4 before being consumed
