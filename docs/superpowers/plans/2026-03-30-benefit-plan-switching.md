# BenefitPlan Switching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add BenefitPlan entity and plan-aware recommendation logic so that "switching cards" (CUBE, Richart, Unicard) recommend the best plan per card and show switch prompts.

**Architecture:** New `BenefitPlan` entity in contracts/API with `planId` linking promotions to plans. DecisionEngine groups plan-bound promotions by `exclusiveGroup`, picks the best plan per card, then merges with traditional promotions for ranking. Plan metadata is API-managed (JSON config), not extractor-managed.

**Tech Stack:** JSON Schema (contracts), Python 3.13 + Pydantic (extractor), Java 21 + Spring Boot (API), React 19 + TypeScript (web)

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `cardsense-contracts/benefit-plan/benefit-plan.schema.json` | BenefitPlan entity JSON Schema |
| `cardsense-contracts/taxonomy/switch-frequency-taxonomy.json` | DAILY / MONTHLY / UNLIMITED enum |
| `cardsense-api/src/main/java/com/cardsense/api/domain/BenefitPlan.java` | BenefitPlan domain class |
| `cardsense-api/src/main/java/com/cardsense/api/domain/ActivePlan.java` | Response DTO for recommended plan |
| `cardsense-api/src/main/java/com/cardsense/api/repository/BenefitPlanRepository.java` | Interface for plan data access |
| `cardsense-api/src/main/java/com/cardsense/api/repository/JsonBenefitPlanRepository.java` | JSON-file-backed implementation |
| `cardsense-api/src/main/resources/benefit-plans.json` | Plan metadata config (CUBE, Richart, Unicard) |
| `cardsense-api/src/test/java/com/cardsense/api/service/DecisionEngineBenefitPlanTest.java` | BenefitPlan-specific decision tests |
| `cardsense-api/src/test/java/com/cardsense/api/repository/JsonBenefitPlanRepositoryTest.java` | Repository tests |

### Modified Files
| File | Change |
|------|--------|
| `cardsense-contracts/promotion/promotion-normalized.schema.json` | Add `planId` (nullable string) |
| `cardsense-contracts/recommendation/recommendation-response.schema.json` | Add `activePlan` to `cardRecommendation` |
| `cardsense-extractor/models/promotion.py` | Add `planId: str \| None = None` |
| `cardsense-api/src/main/java/com/cardsense/api/domain/Promotion.java` | Add `planId` field |
| `cardsense-api/src/main/java/com/cardsense/api/domain/CardRecommendation.java` | Add `activePlan` field |
| `cardsense-api/src/main/java/com/cardsense/api/service/DecisionEngine.java` | Plan-aware grouping in `toCardAggregate` |
| `cardsense-web/src/types/api.ts` | Add `ActivePlan` type, update `CardRecommendation` |
| `cardsense-web/src/components/RecommendationResults.tsx` | Show plan switch prompt |

---

## Task 1: Contracts — Add switch-frequency taxonomy

**Files:**
- Create: `cardsense-contracts/taxonomy/switch-frequency-taxonomy.json`

- [ ] **Step 1: Create taxonomy file**

```json
[
    "daily",
    "monthly",
    "unlimited"
]
```

- [ ] **Step 2: Commit**

```bash
git add cardsense-contracts/taxonomy/switch-frequency-taxonomy.json
git commit -m "feat(contracts): add switch-frequency taxonomy for benefit plan switching"
```

---

## Task 2: Contracts — Add BenefitPlan schema

**Files:**
- Create: `cardsense-contracts/benefit-plan/benefit-plan.schema.json`

- [ ] **Step 1: Create schema file**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://cardsense.com/schemas/benefit-plan.schema.json",
  "title": "BenefitPlan Schema",
  "description": "Schema for credit card benefit plan switching (e.g. CUBE, Richart, Unicard)",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "planId",
    "bankCode",
    "cardCode",
    "planName",
    "planDescription",
    "switchFrequency",
    "requiresSubscription",
    "exclusiveGroup",
    "status",
    "validFrom",
    "validUntil"
  ],
  "properties": {
    "planId": { "type": "string", "minLength": 3 },
    "bankCode": {
      "type": "string",
      "enum": ["CTBC", "ESUN", "TAISHIN", "CATHAY", "MEGA", "FUBON", "FIRST", "SINOPAC", "TPBANK", "UBOT"]
    },
    "cardCode": { "type": "string", "minLength": 3 },
    "planName": { "type": "string", "minLength": 1, "maxLength": 100 },
    "planDescription": { "type": "string", "minLength": 1, "maxLength": 300 },
    "switchFrequency": { "type": "string", "enum": ["DAILY", "MONTHLY", "UNLIMITED"] },
    "switchMaxPerMonth": { "type": ["integer", "null"], "minimum": 1 },
    "requiresSubscription": { "type": "boolean" },
    "subscriptionCost": { "type": ["string", "null"], "maxLength": 100 },
    "exclusiveGroup": { "type": "string", "minLength": 3 },
    "status": { "type": "string", "enum": ["ACTIVE", "EXPIRED"] },
    "validFrom": { "type": "string", "format": "date" },
    "validUntil": { "type": "string", "format": "date" }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add cardsense-contracts/benefit-plan/benefit-plan.schema.json
git commit -m "feat(contracts): add BenefitPlan schema for plan switching cards"
```

---

## Task 3: Contracts — Add `planId` to promotion schema

**Files:**
- Modify: `cardsense-contracts/promotion/promotion-normalized.schema.json`

- [ ] **Step 1: Add `planId` property**

In `promotion-normalized.schema.json`, add `planId` to the `properties` object (after `status`):

```json
"planId": { "type": ["string", "null"], "minLength": 3 }
```

Do NOT add `planId` to `required` — it is nullable and optional for traditional promotions.

- [ ] **Step 2: Commit**

```bash
git add cardsense-contracts/promotion/promotion-normalized.schema.json
git commit -m "feat(contracts): add nullable planId to promotion schema"
```

---

## Task 4: Contracts — Add `activePlan` to recommendation response schema

**Files:**
- Modify: `cardsense-contracts/recommendation/recommendation-response.schema.json`

- [ ] **Step 1: Add `activePlan` definition**

In the `$defs` section, add a new `activePlan` definition:

```json
"activePlan": {
  "type": ["object", "null"],
  "additionalProperties": false,
  "required": ["planId", "planName", "switchRequired", "switchFrequency"],
  "properties": {
    "planId": { "type": "string", "minLength": 3 },
    "planName": { "type": "string", "minLength": 1, "maxLength": 100 },
    "switchRequired": { "type": "boolean" },
    "switchFrequency": { "type": "string", "minLength": 1, "maxLength": 60 }
  }
}
```

- [ ] **Step 2: Add `activePlan` to `cardRecommendation` properties**

In the `cardRecommendation` definition's `properties`, add:

```json
"activePlan": { "$ref": "#/$defs/activePlan" }
```

Do NOT add `activePlan` to `required` — it is null for traditional cards.

- [ ] **Step 3: Commit**

```bash
git add cardsense-contracts/recommendation/recommendation-response.schema.json
git commit -m "feat(contracts): add activePlan to CardRecommendation response"
```

---

## Task 5: Extractor — Add `planId` to Pydantic model

**Files:**
- Modify: `cardsense-extractor/models/promotion.py`

- [ ] **Step 1: Add `planId` field to `PromotionNormalized`**

Add this line after the `status` field (line 87):

```python
    planId: Optional[str] = Field(default=None, min_length=3)
```

- [ ] **Step 2: Run existing tests to verify no regression**

Run: `cd cardsense-extractor && uv run pytest tests/ -v`
Expected: All existing tests PASS (planId is optional with default None, so no existing test breaks)

- [ ] **Step 3: Commit**

```bash
git add cardsense-extractor/models/promotion.py
git commit -m "feat(extractor): add nullable planId field to PromotionNormalized model"
```

---

## Task 6: API — Add `BenefitPlan` domain class

**Files:**
- Create: `cardsense-api/src/main/java/com/cardsense/api/domain/BenefitPlan.java`

- [ ] **Step 1: Create domain class**

```java
package com.cardsense.api.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BenefitPlan {
    private String planId;
    private String bankCode;
    private String cardCode;
    private String planName;
    private String planDescription;
    private String switchFrequency;
    private Integer switchMaxPerMonth;
    private boolean requiresSubscription;
    private String subscriptionCost;
    private String exclusiveGroup;
    private String status;
    private LocalDate validFrom;
    private LocalDate validUntil;
}
```

- [ ] **Step 2: Commit**

```bash
git add cardsense-api/src/main/java/com/cardsense/api/domain/BenefitPlan.java
git commit -m "feat(api): add BenefitPlan domain class"
```

---

## Task 7: API — Add `ActivePlan` response DTO

**Files:**
- Create: `cardsense-api/src/main/java/com/cardsense/api/domain/ActivePlan.java`

- [ ] **Step 1: Create DTO class**

```java
package com.cardsense.api.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivePlan {
    private String planId;
    private String planName;
    private boolean switchRequired;
    private String switchFrequency;
}
```

- [ ] **Step 2: Commit**

```bash
git add cardsense-api/src/main/java/com/cardsense/api/domain/ActivePlan.java
git commit -m "feat(api): add ActivePlan response DTO"
```

---

## Task 8: API — Add `planId` to Promotion, `activePlan` to CardRecommendation

**Files:**
- Modify: `cardsense-api/src/main/java/com/cardsense/api/domain/Promotion.java`
- Modify: `cardsense-api/src/main/java/com/cardsense/api/domain/CardRecommendation.java`

- [ ] **Step 1: Add `planId` to Promotion**

Add this field after `private String status;` (line 77):

```java
    private String planId;
```

- [ ] **Step 2: Add `activePlan` to CardRecommendation**

Add this field after `private String applyUrl;` (line 31):

```java
    private ActivePlan activePlan;
```

- [ ] **Step 3: Run existing tests**

Run: `cd cardsense-api && mvn test -pl . -Dtest=DecisionEngineTest -q`
Expected: All existing tests PASS (new fields default to null)

- [ ] **Step 4: Commit**

```bash
git add cardsense-api/src/main/java/com/cardsense/api/domain/Promotion.java cardsense-api/src/main/java/com/cardsense/api/domain/CardRecommendation.java
git commit -m "feat(api): add planId to Promotion, activePlan to CardRecommendation"
```

---

## Task 9: API — BenefitPlan repository with JSON config

**Files:**
- Create: `cardsense-api/src/main/java/com/cardsense/api/repository/BenefitPlanRepository.java`
- Create: `cardsense-api/src/main/java/com/cardsense/api/repository/JsonBenefitPlanRepository.java`
- Create: `cardsense-api/src/main/resources/benefit-plans.json`
- Create: `cardsense-api/src/test/java/com/cardsense/api/repository/JsonBenefitPlanRepositoryTest.java`

- [ ] **Step 1: Write the failing test**

```java
package com.cardsense.api.repository;

import com.cardsense.api.domain.BenefitPlan;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class JsonBenefitPlanRepositoryTest {

    private BenefitPlanRepository repository;

    @BeforeEach
    public void setup() {
        repository = new JsonBenefitPlanRepository("benefit-plans.json");
    }

    @Test
    public void testFindByCardCodeReturnsCubePlans() {
        List<BenefitPlan> plans = repository.findByCardCode("CATHAY_CUBE");
        assertFalse(plans.isEmpty());
        assertTrue(plans.stream().allMatch(p -> "CATHAY_CUBE".equals(p.getCardCode())));
        assertTrue(plans.stream().allMatch(p -> "CATHAY_CUBE_PLANS".equals(p.getExclusiveGroup())));
    }

    @Test
    public void testFindByCardCodeReturnsEmptyForUnknownCard() {
        List<BenefitPlan> plans = repository.findByCardCode("UNKNOWN_CARD");
        assertTrue(plans.isEmpty());
    }

    @Test
    public void testFindByPlanIdReturnsPlan() {
        BenefitPlan plan = repository.findByPlanId("CATHAY_CUBE_DIGITAL");
        assertEquals("CATHAY_CUBE_DIGITAL", plan.getPlanId());
        assertEquals("玩數位", plan.getPlanName());
        assertEquals("DAILY", plan.getSwitchFrequency());
    }

    @Test
    public void testFindByPlanIdReturnsNullForUnknown() {
        BenefitPlan plan = repository.findByPlanId("NONEXISTENT");
        assertEquals(null, plan);
    }

    @Test
    public void testFindActivePlansFiltersByDate() {
        LocalDate testDate = LocalDate.of(2026, 3, 15);
        List<BenefitPlan> plans = repository.findActivePlans(testDate);
        assertTrue(plans.stream().allMatch(p ->
                !testDate.isBefore(p.getValidFrom()) && !testDate.isAfter(p.getValidUntil())
        ));
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd cardsense-api && mvn test -pl . -Dtest=JsonBenefitPlanRepositoryTest -q`
Expected: FAIL — `BenefitPlanRepository` does not exist

- [ ] **Step 3: Create `BenefitPlanRepository` interface**

```java
package com.cardsense.api.repository;

import com.cardsense.api.domain.BenefitPlan;

import java.time.LocalDate;
import java.util.List;

public interface BenefitPlanRepository {
    List<BenefitPlan> findByCardCode(String cardCode);
    BenefitPlan findByPlanId(String planId);
    List<BenefitPlan> findActivePlans(LocalDate date);
}
```

- [ ] **Step 4: Create `benefit-plans.json` config**

```json
[
  {
    "planId": "CATHAY_CUBE_DIGITAL",
    "bankCode": "CATHAY",
    "cardCode": "CATHAY_CUBE",
    "planName": "玩數位",
    "planDescription": "涵蓋電商、串流、AI工具等通路",
    "switchFrequency": "DAILY",
    "switchMaxPerMonth": null,
    "requiresSubscription": false,
    "subscriptionCost": null,
    "exclusiveGroup": "CATHAY_CUBE_PLANS",
    "status": "ACTIVE",
    "validFrom": "2026-01-01",
    "validUntil": "2026-06-30"
  },
  {
    "planId": "CATHAY_CUBE_SHOPPING",
    "bankCode": "CATHAY",
    "cardCode": "CATHAY_CUBE",
    "planName": "樂饗購",
    "planDescription": "百貨、量販、超市等通路",
    "switchFrequency": "DAILY",
    "switchMaxPerMonth": null,
    "requiresSubscription": false,
    "subscriptionCost": null,
    "exclusiveGroup": "CATHAY_CUBE_PLANS",
    "status": "ACTIVE",
    "validFrom": "2026-01-01",
    "validUntil": "2026-06-30"
  },
  {
    "planId": "CATHAY_CUBE_TRAVEL",
    "bankCode": "CATHAY",
    "cardCode": "CATHAY_CUBE",
    "planName": "趣旅行",
    "planDescription": "航空、飯店、旅遊平台",
    "switchFrequency": "DAILY",
    "switchMaxPerMonth": null,
    "requiresSubscription": false,
    "subscriptionCost": null,
    "exclusiveGroup": "CATHAY_CUBE_PLANS",
    "status": "ACTIVE",
    "validFrom": "2026-01-01",
    "validUntil": "2026-06-30"
  },
  {
    "planId": "CATHAY_CUBE_ESSENTIALS",
    "bankCode": "CATHAY",
    "cardCode": "CATHAY_CUBE",
    "planName": "集精選",
    "planDescription": "超商、全聯、加油等通路",
    "switchFrequency": "DAILY",
    "switchMaxPerMonth": null,
    "requiresSubscription": false,
    "subscriptionCost": null,
    "exclusiveGroup": "CATHAY_CUBE_PLANS",
    "status": "ACTIVE",
    "validFrom": "2026-01-01",
    "validUntil": "2026-06-30"
  },
  {
    "planId": "TAISHIN_RICHART_PAY",
    "bankCode": "TAISHIN",
    "cardCode": "TAISHIN_RICHART",
    "planName": "Pay著刷",
    "planDescription": "行動支付回饋加碼",
    "switchFrequency": "DAILY",
    "switchMaxPerMonth": null,
    "requiresSubscription": false,
    "subscriptionCost": null,
    "exclusiveGroup": "TAISHIN_RICHART_PLANS",
    "status": "ACTIVE",
    "validFrom": "2026-01-01",
    "validUntil": "2026-06-30"
  },
  {
    "planId": "TAISHIN_RICHART_DAILY",
    "bankCode": "TAISHIN",
    "cardCode": "TAISHIN_RICHART",
    "planName": "天天刷",
    "planDescription": "日常消費回饋",
    "switchFrequency": "DAILY",
    "switchMaxPerMonth": null,
    "requiresSubscription": false,
    "subscriptionCost": null,
    "exclusiveGroup": "TAISHIN_RICHART_PLANS",
    "status": "ACTIVE",
    "validFrom": "2026-01-01",
    "validUntil": "2026-06-30"
  },
  {
    "planId": "TAISHIN_RICHART_BIG",
    "bankCode": "TAISHIN",
    "cardCode": "TAISHIN_RICHART",
    "planName": "大筆刷",
    "planDescription": "高額消費回饋加碼",
    "switchFrequency": "DAILY",
    "switchMaxPerMonth": null,
    "requiresSubscription": false,
    "subscriptionCost": null,
    "exclusiveGroup": "TAISHIN_RICHART_PLANS",
    "status": "ACTIVE",
    "validFrom": "2026-01-01",
    "validUntil": "2026-06-30"
  },
  {
    "planId": "TAISHIN_RICHART_DINING",
    "bankCode": "TAISHIN",
    "cardCode": "TAISHIN_RICHART",
    "planName": "好饗刷",
    "planDescription": "餐飲消費回饋",
    "switchFrequency": "DAILY",
    "switchMaxPerMonth": null,
    "requiresSubscription": false,
    "subscriptionCost": null,
    "exclusiveGroup": "TAISHIN_RICHART_PLANS",
    "status": "ACTIVE",
    "validFrom": "2026-01-01",
    "validUntil": "2026-06-30"
  },
  {
    "planId": "TAISHIN_RICHART_DIGITAL",
    "bankCode": "TAISHIN",
    "cardCode": "TAISHIN_RICHART",
    "planName": "數趣刷",
    "planDescription": "數位娛樂消費回饋",
    "switchFrequency": "DAILY",
    "switchMaxPerMonth": null,
    "requiresSubscription": false,
    "subscriptionCost": null,
    "exclusiveGroup": "TAISHIN_RICHART_PLANS",
    "status": "ACTIVE",
    "validFrom": "2026-01-01",
    "validUntil": "2026-06-30"
  },
  {
    "planId": "TAISHIN_RICHART_TRAVEL",
    "bankCode": "TAISHIN",
    "cardCode": "TAISHIN_RICHART",
    "planName": "玩旅刷",
    "planDescription": "旅遊消費回饋",
    "switchFrequency": "DAILY",
    "switchMaxPerMonth": null,
    "requiresSubscription": false,
    "subscriptionCost": null,
    "exclusiveGroup": "TAISHIN_RICHART_PLANS",
    "status": "ACTIVE",
    "validFrom": "2026-01-01",
    "validUntil": "2026-06-30"
  },
  {
    "planId": "TAISHIN_RICHART_WEEKEND",
    "bankCode": "TAISHIN",
    "cardCode": "TAISHIN_RICHART",
    "planName": "假日刷",
    "planDescription": "週末消費回饋加碼",
    "switchFrequency": "DAILY",
    "switchMaxPerMonth": null,
    "requiresSubscription": false,
    "subscriptionCost": null,
    "exclusiveGroup": "TAISHIN_RICHART_PLANS",
    "status": "ACTIVE",
    "validFrom": "2026-01-01",
    "validUntil": "2026-06-30"
  },
  {
    "planId": "ESUN_UNICARD_SIMPLE",
    "bankCode": "ESUN",
    "cardCode": "ESUN_UNICARD",
    "planName": "簡單選",
    "planDescription": "固定通路回饋",
    "switchFrequency": "MONTHLY",
    "switchMaxPerMonth": 30,
    "requiresSubscription": false,
    "subscriptionCost": null,
    "exclusiveGroup": "ESUN_UNICARD_PLANS",
    "status": "ACTIVE",
    "validFrom": "2026-01-01",
    "validUntil": "2026-06-30"
  },
  {
    "planId": "ESUN_UNICARD_FLEXIBLE",
    "bankCode": "ESUN",
    "cardCode": "ESUN_UNICARD",
    "planName": "任意選",
    "planDescription": "自選通路回饋",
    "switchFrequency": "MONTHLY",
    "switchMaxPerMonth": 30,
    "requiresSubscription": false,
    "subscriptionCost": null,
    "exclusiveGroup": "ESUN_UNICARD_PLANS",
    "status": "ACTIVE",
    "validFrom": "2026-01-01",
    "validUntil": "2026-06-30"
  },
  {
    "planId": "ESUN_UNICARD_UP",
    "bankCode": "ESUN",
    "cardCode": "ESUN_UNICARD",
    "planName": "UP選",
    "planDescription": "高回饋通路",
    "switchFrequency": "MONTHLY",
    "switchMaxPerMonth": 30,
    "requiresSubscription": true,
    "subscriptionCost": "149 e point",
    "exclusiveGroup": "ESUN_UNICARD_PLANS",
    "status": "ACTIVE",
    "validFrom": "2026-01-01",
    "validUntil": "2026-06-30"
  }
]
```

- [ ] **Step 5: Implement `JsonBenefitPlanRepository`**

```java
package com.cardsense.api.repository;

import com.cardsense.api.domain.BenefitPlan;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Repository;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.List;

@Repository
public class JsonBenefitPlanRepository implements BenefitPlanRepository {

    private final String resourcePath;
    private List<BenefitPlan> plans;

    public JsonBenefitPlanRepository(@Value("${cardsense.benefit-plans.path:benefit-plans.json}") String resourcePath) {
        this.resourcePath = resourcePath;
    }

    @PostConstruct
    public void init() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        try (InputStream is = new ClassPathResource(resourcePath).getInputStream()) {
            plans = mapper.readValue(is, new TypeReference<List<BenefitPlan>>() {});
        } catch (IOException e) {
            throw new RuntimeException("Failed to load benefit plans from " + resourcePath, e);
        }
    }

    @Override
    public List<BenefitPlan> findByCardCode(String cardCode) {
        return plans.stream()
                .filter(p -> cardCode.equalsIgnoreCase(p.getCardCode()))
                .toList();
    }

    @Override
    public BenefitPlan findByPlanId(String planId) {
        return plans.stream()
                .filter(p -> planId.equalsIgnoreCase(p.getPlanId()))
                .findFirst()
                .orElse(null);
    }

    @Override
    public List<BenefitPlan> findActivePlans(LocalDate date) {
        return plans.stream()
                .filter(p -> "ACTIVE".equalsIgnoreCase(p.getStatus()))
                .filter(p -> !date.isBefore(p.getValidFrom()) && !date.isAfter(p.getValidUntil()))
                .toList();
    }
}
```

- [ ] **Step 6: Run tests**

Run: `cd cardsense-api && mvn test -pl . -Dtest=JsonBenefitPlanRepositoryTest -q`
Expected: All 5 tests PASS

- [ ] **Step 7: Commit**

```bash
git add cardsense-api/src/main/java/com/cardsense/api/repository/BenefitPlanRepository.java \
       cardsense-api/src/main/java/com/cardsense/api/repository/JsonBenefitPlanRepository.java \
       cardsense-api/src/main/resources/benefit-plans.json \
       cardsense-api/src/test/java/com/cardsense/api/repository/JsonBenefitPlanRepositoryTest.java
git commit -m "feat(api): add BenefitPlanRepository with JSON config for CUBE, Richart, Unicard"
```

---

## Task 10: API — Plan-aware DecisionEngine logic

This is the core change. The DecisionEngine's `toCardAggregate` must:
1. Separate promotions into traditional (planId=null) and plan-bound groups
2. For plan-bound promotions within the same exclusiveGroup, pick the plan whose promotions yield the highest total return
3. Combine the winning plan's promotions with traditional promotions

**Files:**
- Modify: `cardsense-api/src/main/java/com/cardsense/api/service/DecisionEngine.java`
- Create: `cardsense-api/src/test/java/com/cardsense/api/service/DecisionEngineBenefitPlanTest.java`

- [ ] **Step 1: Write the failing tests**

```java
package com.cardsense.api.service;

import com.cardsense.api.domain.ActivePlan;
import com.cardsense.api.domain.BenefitPlan;
import com.cardsense.api.domain.Promotion;
import com.cardsense.api.domain.PromotionCondition;
import com.cardsense.api.domain.RecommendationRequest;
import com.cardsense.api.domain.RecommendationResponse;
import com.cardsense.api.domain.RecommendationScenario;
import com.cardsense.api.domain.RecommendationComparisonOptions;
import com.cardsense.api.repository.BenefitPlanRepository;
import com.cardsense.api.repository.PromotionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

public class DecisionEngineBenefitPlanTest {

    private PromotionRepository promotionRepository;
    private BenefitPlanRepository benefitPlanRepository;
    private RewardCalculator rewardCalculator;
    private DecisionEngine decisionEngine;

    @BeforeEach
    public void setup() {
        promotionRepository = Mockito.mock(PromotionRepository.class);
        benefitPlanRepository = Mockito.mock(BenefitPlanRepository.class);
        rewardCalculator = new RewardCalculator();
        decisionEngine = new DecisionEngine(promotionRepository, rewardCalculator, benefitPlanRepository);
    }

    @Test
    public void testRecommendPicksBestPlanForSwitchingCard() {
        // CUBE card: base promo (no plan) + digital plan promo (蝦皮 3%) + shopping plan promo (SOGO 3%)
        Promotion basePromo = buildPromotion("base1", "base_ver1", "CATHAY_CUBE", "CUBE卡", "CATHAY", "國泰世華",
                BigDecimal.valueOf(0.3), null, 0, LocalDate.of(2026, 6, 30));
        basePromo.setPlanId(null); // traditional, always active

        Promotion shopeePromo = buildPromotion("digital1", "digital_ver1", "CATHAY_CUBE", "CUBE卡", "CATHAY", "國泰世華",
                BigDecimal.valueOf(3.0), 500, 0, LocalDate.of(2026, 6, 30));
        shopeePromo.setPlanId("CATHAY_CUBE_DIGITAL");
        shopeePromo.setConditions(List.of(condition("ECOMMERCE_PLATFORM", "SHOPEE", "蝦皮")));

        Promotion sogoPromo = buildPromotion("shopping1", "shopping_ver1", "CATHAY_CUBE", "CUBE卡", "CATHAY", "國泰世華",
                BigDecimal.valueOf(3.0), 500, 0, LocalDate.of(2026, 6, 30));
        sogoPromo.setPlanId("CATHAY_CUBE_SHOPPING");
        sogoPromo.setConditions(List.of(condition("RETAIL_CHAIN", "SOGO", "SOGO")));

        when(promotionRepository.findActivePromotions(any())).thenReturn(List.of(basePromo, shopeePromo, sogoPromo));

        BenefitPlan digitalPlan = BenefitPlan.builder()
                .planId("CATHAY_CUBE_DIGITAL").cardCode("CATHAY_CUBE").planName("玩數位")
                .switchFrequency("DAILY").exclusiveGroup("CATHAY_CUBE_PLANS")
                .status("ACTIVE").validFrom(LocalDate.of(2026, 1, 1)).validUntil(LocalDate.of(2026, 6, 30))
                .build();
        BenefitPlan shoppingPlan = BenefitPlan.builder()
                .planId("CATHAY_CUBE_SHOPPING").cardCode("CATHAY_CUBE").planName("樂饗購")
                .switchFrequency("DAILY").exclusiveGroup("CATHAY_CUBE_PLANS")
                .status("ACTIVE").validFrom(LocalDate.of(2026, 1, 1)).validUntil(LocalDate.of(2026, 6, 30))
                .build();
        when(benefitPlanRepository.findByPlanId("CATHAY_CUBE_DIGITAL")).thenReturn(digitalPlan);
        when(benefitPlanRepository.findByPlanId("CATHAY_CUBE_SHOPPING")).thenReturn(shoppingPlan);

        // Query: 蝦皮消費 3000 元 → digital plan should win (3% = 90元) over shopping plan (蝦皮 not applicable)
        RecommendationResponse response = decisionEngine.recommend(RecommendationRequest.builder()
                .scenario(RecommendationScenario.builder()
                        .amount(3000)
                        .category("ONLINE")
                        .merchantName("SHOPEE")
                        .date(LocalDate.of(2026, 3, 15))
                        .build())
                .comparison(RecommendationComparisonOptions.builder()
                        .includePromotionBreakdown(true)
                        .build())
                .build());

        assertEquals(1, response.getRecommendations().size());
        var rec = response.getRecommendations().get(0);
        assertEquals("CATHAY_CUBE", rec.getCardCode());

        // activePlan should be the digital plan
        assertNotNull(rec.getActivePlan());
        assertEquals("CATHAY_CUBE_DIGITAL", rec.getActivePlan().getPlanId());
        assertEquals("玩數位", rec.getActivePlan().getPlanName());
        assertTrue(rec.getActivePlan().isSwitchRequired());
        assertEquals("每天可切換1次", rec.getActivePlan().getSwitchFrequency());

        // Total return should include base (0.3% of 3000 = 9) + digital (3% of 3000 = 90) = 99
        // but only if base is stackable — for simplicity base has no planId so it's always included
        assertTrue(rec.getEstimatedReturn() >= 90);
    }

    @Test
    public void testTraditionalCardHasNullActivePlan() {
        Promotion traditionalPromo = buildPromotion("trad1", "trad_ver1", "CTBC_DEMO", "中信卡", "CTBC", "中國信託",
                BigDecimal.valueOf(3.0), 500, 0, LocalDate.of(2026, 6, 30));
        traditionalPromo.setPlanId(null);

        when(promotionRepository.findActivePromotions(any())).thenReturn(List.of(traditionalPromo));

        RecommendationResponse response = decisionEngine.recommend(RecommendationRequest.builder()
                .amount(1000).category("ONLINE").date(LocalDate.of(2026, 3, 15)).build());

        assertEquals(1, response.getRecommendations().size());
        assertNull(response.getRecommendations().get(0).getActivePlan());
    }

    @Test
    public void testPlanPromotionsFromNonWinningPlansAreExcluded() {
        // Two plan-bound promotions from different plans, same card.
        // Query category matches both. Digital plan gives higher return.
        Promotion digitalPromo = buildPromotion("d1", "d_ver1", "CATHAY_CUBE", "CUBE卡", "CATHAY", "國泰世華",
                BigDecimal.valueOf(3.0), 500, 0, LocalDate.of(2026, 6, 30));
        digitalPromo.setPlanId("CATHAY_CUBE_DIGITAL");

        Promotion essentialsPromo = buildPromotion("e1", "e_ver1", "CATHAY_CUBE", "CUBE卡", "CATHAY", "國泰世華",
                BigDecimal.valueOf(2.0), 500, 0, LocalDate.of(2026, 6, 30));
        essentialsPromo.setPlanId("CATHAY_CUBE_ESSENTIALS");

        when(promotionRepository.findActivePromotions(any())).thenReturn(List.of(digitalPromo, essentialsPromo));

        BenefitPlan digitalPlan = BenefitPlan.builder()
                .planId("CATHAY_CUBE_DIGITAL").cardCode("CATHAY_CUBE").planName("玩數位")
                .switchFrequency("DAILY").exclusiveGroup("CATHAY_CUBE_PLANS")
                .status("ACTIVE").validFrom(LocalDate.of(2026, 1, 1)).validUntil(LocalDate.of(2026, 6, 30))
                .build();
        BenefitPlan essentialsPlan = BenefitPlan.builder()
                .planId("CATHAY_CUBE_ESSENTIALS").cardCode("CATHAY_CUBE").planName("集精選")
                .switchFrequency("DAILY").exclusiveGroup("CATHAY_CUBE_PLANS")
                .status("ACTIVE").validFrom(LocalDate.of(2026, 1, 1)).validUntil(LocalDate.of(2026, 6, 30))
                .build();
        when(benefitPlanRepository.findByPlanId("CATHAY_CUBE_DIGITAL")).thenReturn(digitalPlan);
        when(benefitPlanRepository.findByPlanId("CATHAY_CUBE_ESSENTIALS")).thenReturn(essentialsPlan);

        RecommendationResponse response = decisionEngine.recommend(RecommendationRequest.builder()
                .scenario(RecommendationScenario.builder()
                        .amount(1000).category("ONLINE").date(LocalDate.of(2026, 3, 15)).build())
                .comparison(RecommendationComparisonOptions.builder()
                        .includePromotionBreakdown(true).build())
                .build());

        assertEquals(1, response.getRecommendations().size());
        var rec = response.getRecommendations().get(0);
        // Digital plan (3%) beats essentials plan (2%)
        assertEquals("CATHAY_CUBE_DIGITAL", rec.getActivePlan().getPlanId());
        assertEquals(30, rec.getEstimatedReturn()); // 3% of 1000
    }

    private Promotion buildPromotion(String promoId, String promoVersionId, String cardCode, String cardName,
                                      String bankCode, String bankName, BigDecimal cashbackValue,
                                      Integer maxCashback, Integer annualFee, LocalDate validUntil) {
        return Promotion.builder()
                .promoId(promoId)
                .promoVersionId(promoVersionId)
                .cardCode(cardCode)
                .cardName(cardName)
                .bankCode(bankCode)
                .bankName(bankName)
                .category("ONLINE")
                .recommendationScope("RECOMMENDABLE")
                .cashbackType("PERCENT")
                .cashbackValue(cashbackValue)
                .maxCashback(maxCashback)
                .annualFee(annualFee)
                .cardStatus("ACTIVE")
                .validUntil(validUntil)
                .status("ACTIVE")
                .build();
    }

    private PromotionCondition condition(String type, String value, String label) {
        return PromotionCondition.builder().type(type).value(value).label(label).build();
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd cardsense-api && mvn test -pl . -Dtest=DecisionEngineBenefitPlanTest -q`
Expected: FAIL — DecisionEngine constructor doesn't accept BenefitPlanRepository

- [ ] **Step 3: Modify DecisionEngine to accept BenefitPlanRepository**

In `DecisionEngine.java`, add the new dependency. Change the constructor fields (the class uses `@RequiredArgsConstructor`):

Add after `private final RewardCalculator rewardCalculator;` (line 42):

```java
    private final BenefitPlanRepository benefitPlanRepository;
```

Add import:

```java
import com.cardsense.api.repository.BenefitPlanRepository;
import com.cardsense.api.domain.ActivePlan;
import com.cardsense.api.domain.BenefitPlan;
```

- [ ] **Step 4: Add plan resolution method to DecisionEngine**

Add this method after `toCardAggregate`:

```java
    /**
     * For a card's eligible promotions, resolve the best benefit plan within each exclusive group.
     * Returns the winning plan's promotions + all traditional (planId=null) promotions.
     * Non-winning plan promotions are discarded before stack resolution.
     */
    private PlanResolution resolveBestPlan(List<ScoredPromotion> promotions) {
        List<ScoredPromotion> traditional = promotions.stream()
                .filter(sp -> sp.promotion().getPlanId() == null || sp.promotion().getPlanId().isBlank())
                .toList();

        List<ScoredPromotion> planBound = promotions.stream()
                .filter(sp -> sp.promotion().getPlanId() != null && !sp.promotion().getPlanId().isBlank())
                .toList();

        if (planBound.isEmpty()) {
            return new PlanResolution(promotions, null);
        }

        // Group plan-bound promotions by exclusiveGroup
        // Within each exclusive group, pick the planId whose promotions give the highest total return
        record PlanGroup(String exclusiveGroup, String planId, List<ScoredPromotion> promotions, int totalReturn) {}

        java.util.Map<String, List<PlanGroup>> groupsByExclusive = planBound.stream()
                .collect(Collectors.groupingBy(sp -> {
                    BenefitPlan plan = benefitPlanRepository.findByPlanId(sp.promotion().getPlanId());
                    return plan != null ? plan.getExclusiveGroup() : "__NONE__";
                }))
                .entrySet().stream()
                .collect(Collectors.toMap(
                        java.util.Map.Entry::getKey,
                        entry -> entry.getValue().stream()
                                .collect(Collectors.groupingBy(sp -> normalizeValue(sp.promotion().getPlanId())))
                                .entrySet().stream()
                                .map(planEntry -> new PlanGroup(
                                        entry.getKey(),
                                        planEntry.getKey(),
                                        planEntry.getValue(),
                                        planEntry.getValue().stream().mapToInt(ScoredPromotion::cappedReturn).sum()))
                                .toList()
                ));

        List<ScoredPromotion> winningPlanPromotions = new ArrayList<>();
        BenefitPlan winningPlan = null;

        for (var entry : groupsByExclusive.entrySet()) {
            List<PlanGroup> planGroups = entry.getValue();
            PlanGroup best = planGroups.stream()
                    .max(Comparator.comparingInt(PlanGroup::totalReturn))
                    .orElse(null);
            if (best != null) {
                winningPlanPromotions.addAll(best.promotions());
                // Find the actual BenefitPlan metadata for the winning plan
                if (winningPlan == null || best.totalReturn() > 0) {
                    // Use the original planId (not normalized) to look up
                    String originalPlanId = best.promotions().get(0).promotion().getPlanId();
                    BenefitPlan candidate = benefitPlanRepository.findByPlanId(originalPlanId);
                    if (candidate != null && (winningPlan == null || best.totalReturn() > 0)) {
                        winningPlan = candidate;
                    }
                }
            }
        }

        List<ScoredPromotion> combined = new ArrayList<>(traditional);
        combined.addAll(winningPlanPromotions);

        return new PlanResolution(combined, winningPlan);
    }

    private record PlanResolution(
            List<ScoredPromotion> promotions,
            BenefitPlan winningPlan
    ) {}
```

- [ ] **Step 5: Modify `toCardAggregate` to use plan resolution**

Replace the existing `toCardAggregate` method:

```java
    private CardAggregate toCardAggregate(List<ScoredPromotion> promotions) {
        List<String> notes = new ArrayList<>();

        // Resolve best plan before stack resolution
        PlanResolution planResolution = resolveBestPlan(promotions);
        List<ScoredPromotion> effectivePromotions = planResolution.promotions();

        StackResolution resolution = resolveContributingPromotions(effectivePromotions);
        List<ScoredPromotion> contributingPromotions = resolution.contributingPromotions();
        notes.addAll(resolution.notes());

        if (planResolution.winningPlan() != null) {
            notes.add(String.format("推薦切換至「%s」方案以獲得最高回饋。", planResolution.winningPlan().getPlanName()));
        }

        ScoredPromotion primary = contributingPromotions.get(0);
        int totalReturn = contributingPromotions.stream().mapToInt(ScoredPromotion::cappedReturn).sum();

        return new CardAggregate(primary.promotion(), promotions, contributingPromotions, totalReturn, notes, planResolution.winningPlan());
    }
```

- [ ] **Step 6: Update the `CardAggregate` record to include `winningPlan`**

```java
    private record CardAggregate(
            Promotion primaryPromotion,
            List<ScoredPromotion> allEligiblePromotions,
            List<ScoredPromotion> contributingPromotions,
            int totalReturn,
            List<String> notes,
            BenefitPlan winningPlan
    ) {
    }
```

- [ ] **Step 7: Update `toRecommendation` to set `activePlan`**

In the `toRecommendation` method, after `.applyUrl(promotion.getApplyUrl())`, add:

```java
                .activePlan(buildActivePlan(cardAggregate.winningPlan()))
```

Add the helper method:

```java
    private ActivePlan buildActivePlan(BenefitPlan plan) {
        if (plan == null) {
            return null;
        }
        String frequencyText = switch (plan.getSwitchFrequency().toUpperCase()) {
            case "DAILY" -> "每天可切換1次";
            case "MONTHLY" -> plan.getSwitchMaxPerMonth() != null
                    ? String.format("每月最多切換%d次", plan.getSwitchMaxPerMonth())
                    : "每月可切換";
            case "UNLIMITED" -> "不限次數";
            default -> plan.getSwitchFrequency();
        };
        return ActivePlan.builder()
                .planId(plan.getPlanId())
                .planName(plan.getPlanName())
                .switchRequired(true)
                .switchFrequency(frequencyText)
                .build();
    }
```

- [ ] **Step 8: Fix existing DecisionEngineTest setup**

The existing `DecisionEngineTest` needs to pass a mock `BenefitPlanRepository` to the constructor. In `DecisionEngineTest.java`, update the `setup()` method:

```java
    @BeforeEach
    public void setup() {
        promotionRepository = Mockito.mock(PromotionRepository.class);
        rewardCalculator = new RewardCalculator();
        BenefitPlanRepository benefitPlanRepository = Mockito.mock(BenefitPlanRepository.class);
        decisionEngine = new DecisionEngine(promotionRepository, rewardCalculator, benefitPlanRepository);
    }
```

Add imports:

```java
import com.cardsense.api.repository.BenefitPlanRepository;
```

- [ ] **Step 9: Run all tests**

Run: `cd cardsense-api && mvn test -pl . -Dtest="DecisionEngineTest,DecisionEngineBenefitPlanTest" -q`
Expected: All tests PASS (existing tests unaffected because their promotions have null planId, new tests validate plan logic)

- [ ] **Step 10: Commit**

```bash
git add cardsense-api/src/main/java/com/cardsense/api/service/DecisionEngine.java \
       cardsense-api/src/test/java/com/cardsense/api/service/DecisionEngineBenefitPlanTest.java \
       cardsense-api/src/test/java/com/cardsense/api/service/DecisionEngineTest.java
git commit -m "feat(api): add plan-aware recommendation logic to DecisionEngine

Resolves best benefit plan per exclusive group before stack resolution.
Traditional promotions (planId=null) pass through unchanged."
```

---

## Task 11: API — Add GET /v1/cards/{cardCode}/plans endpoint

**Files:**
- Modify: `cardsense-api/src/main/java/com/cardsense/api/controller/CardController.java`

- [ ] **Step 1: Add endpoint**

Add this method to `CardController`:

```java
    @GetMapping("/{cardCode}/plans")
    public ResponseEntity<List<BenefitPlan>> listCardPlans(@PathVariable String cardCode) {
        List<BenefitPlan> plans = benefitPlanRepository.findByCardCode(cardCode);
        return ResponseEntity.ok(plans);
    }
```

Add the `BenefitPlanRepository` dependency — change the class to inject it:

```java
    private final CatalogService catalogService;
    private final BenefitPlanRepository benefitPlanRepository;
```

Add imports:

```java
import com.cardsense.api.domain.BenefitPlan;
import com.cardsense.api.repository.BenefitPlanRepository;
```

- [ ] **Step 2: Commit**

```bash
git add cardsense-api/src/main/java/com/cardsense/api/controller/CardController.java
git commit -m "feat(api): add GET /v1/cards/{cardCode}/plans endpoint"
```

---

## Task 12: Web — Add ActivePlan type and update CardRecommendation

**Files:**
- Modify: `cardsense-web/src/types/api.ts`

- [ ] **Step 1: Add `ActivePlan` interface**

After the `PromotionCondition` interface (line 75), add:

```typescript
export interface ActivePlan {
  planId: string
  planName: string
  switchRequired: boolean
  switchFrequency: string
}
```

- [ ] **Step 2: Add `activePlan` to `CardRecommendation`**

Add `activePlan` field after `applyUrl`:

```typescript
  activePlan: ActivePlan | null
```

- [ ] **Step 3: Commit**

```bash
git add cardsense-web/src/types/api.ts
git commit -m "feat(web): add ActivePlan type to CardRecommendation"
```

---

## Task 13: Web — Show plan switch prompt in recommendation results

**Files:**
- Modify: `cardsense-web/src/components/RecommendationResults.tsx`

- [ ] **Step 1: Add PlanSwitchBadge component**

Add this component after the `ConditionBadges` function:

```tsx
/** Plan switching prompt */
function PlanSwitchBadge({ rec }: { rec: CardRecommendation }) {
  if (!rec.activePlan) return null

  return (
    <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
      <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
      <div className="text-xs space-y-0.5">
        <p className="font-medium text-foreground">
          需切換至「{rec.activePlan.planName}」方案
        </p>
        <p className="text-muted-foreground">
          {rec.activePlan.switchFrequency}
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add PlanSwitchBadge to TopPickCard**

In the `TopPickCard` component, add `<PlanSwitchBadge rec={rec} />` after `<ConditionBadges rec={rec} />` (after line 161):

```tsx
        <ConditionBadges rec={rec} />
        <PlanSwitchBadge rec={rec} />
```

- [ ] **Step 3: Add PlanSwitchBadge to RunnerUpCard**

In the `RunnerUpCard` component, add `<PlanSwitchBadge rec={rec} />` after `<ConditionBadges rec={rec} />` (after line 199):

```tsx
        <ConditionBadges rec={rec} />
        <PlanSwitchBadge rec={rec} />
```

- [ ] **Step 4: Commit**

```bash
git add cardsense-web/src/components/RecommendationResults.tsx
git commit -m "feat(web): show plan switch prompt in recommendation results"
```

---

## Task 14: Verify full stack

- [ ] **Step 1: Run all API tests**

Run: `cd cardsense-api && mvn test -q`
Expected: All tests PASS

- [ ] **Step 2: Run all extractor tests**

Run: `cd cardsense-extractor && uv run pytest tests/ -v`
Expected: All tests PASS

- [ ] **Step 3: Run web type check**

Run: `cd cardsense-web && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 4: Commit any remaining fixes if needed**

---

## Self-Review Checklist

1. **Spec coverage:**
   - BenefitPlan entity: Task 2 (schema), Task 6 (domain)
   - Promotion `planId`: Task 3 (schema), Task 5 (extractor), Task 8 (API)
   - Recommendation `activePlan`: Task 4 (schema), Task 7 (DTO), Task 8 (API), Task 12 (web type)
   - Switch frequency taxonomy: Task 1
   - DecisionEngine plan logic: Task 10
   - GET /v1/cards/{cardCode}/plans: Task 11
   - Web plan switch prompt: Task 13
   - BenefitPlanRepository: Task 9

2. **Placeholder scan:** No TBDs, TODOs, or placeholders found.

3. **Type consistency:** `ActivePlan`, `BenefitPlan`, `planId`, `activePlan`, `exclusiveGroup`, `switchFrequency` — all consistent across tasks.
