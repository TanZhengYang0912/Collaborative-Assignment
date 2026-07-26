# TrueBites Admin Console Redesign

## Goal

Turn the admin area into a quiet, operational control centre for vendor quality, AI content processing, and review moderation. The admin visual language is intentionally independent from the consumer-facing Hidden Gem brand palette.

## Visual direction

Use a Graphite + Cobalt system:

- Canvas: `#F7F8FA`
- Panels: `#FFFFFF`
- Primary text: `#17212B`
- Muted text: `#667281`
- Primary action: `#3658D4`
- Success: `#198A70`
- Warning: `#B7791F`
- Danger: `#C44747`
- Border: `#E3E7ED`

The interface uses Inter, 12px panel radii, light borders, restrained shadows, one action color, and semantic status colors only for status. No consumer-brand gold or decorative gradients are used in admin.

## Information architecture

Keep the existing routes while presenting them as five operational areas:

1. Overview
2. Vendors
3. AI Content Queue
4. Review Moderation
5. Settings

Analytics remain on Overview rather than creating a separate empty analytics page.

## Dashboard composition

The dashboard contains:

- Five KPI cards: total vendors, active rate, pending drafts, AI imported, and reviews to moderate.
- Vendor growth line chart with 7/30/90 day range.
- AI content pipeline: submitted, processing, completed, needs review, draft created, failed.
- Category distribution horizontal bars.
- Source mix bars for TikTok and YouTube.
- Needs Attention queue for draft review, failed AI jobs, missing addresses, duplicates, and hidden reviews.
- Recent activity table with direct actions.

Only metrics available in the current database are shown initially. Visitor, revenue, and engagement metrics are deferred until event tracking exists.

## Data contract

`GET /api/admin/dashboard` returns:

```js
{
  kpis,
  vendorTrend,
  statusBreakdown,
  categoryBreakdown,
  sourceBreakdown,
  aiPipeline,
  attentionItems,
  recentVendors,
  recentProcessing,
  lastUpdated
}
```

The backend derives trend and distribution values from vendor and review records through the existing Supabase client. No fabricated analytics are introduced.

## Page language

- Vendors becomes a dense, filterable operations table with a drawer-friendly detail pattern.
- AI Processing becomes a queue with status tabs and review-first actions.
- Reviews becomes a moderation inbox with visibility filters and direct actions.
- Settings becomes grouped settings sections with clearer system/integration boundaries.

## Responsive and accessibility constraints

- Desktop uses a 12-column grid; small screens collapse to one column.
- Every chart has a text summary or accessible label.
- Keyboard focus remains visible on navigation, filters, table actions, and chart controls.
- Reduced-motion users receive no decorative animation.
- Loading, error, and empty states use the same panel language as loaded states.
