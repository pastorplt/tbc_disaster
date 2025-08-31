
# TBC Workers (monorepo)

Three Cloudflare Workers, one folder each:

- `workers/network-map`
- `workers/organization-map`
- `workers/disaster-data`

## How to connect via Cloudflare Git Integration (no custom CI needed)

1. Push this repo to GitHub.
2. In Cloudflare Dashboard → Workers & Pages → Create application → Workers → Connect to Git.
3. Choose this repository, then set Root directory to the worker you’re configuring (e.g. `workers/network-map`).
4. Build config:
   - Build command: `npx wrangler deploy`
   - Build output directory: (leave empty)
5. Add Bindings for each Worker (R2) and Variables/Secrets:
   - Variables (plain): AIRTABLE_BASE_ID, NETWORKS_TABLE_NAME (for network-map), ORG_TABLE_NAME (optional overrides), FIELD_LAT, FIELD_LON, AIRTABLE_VIEW_NAME (optional)
   - Secrets: AIRTABLE_TOKEN, REGEN_TOKEN
   - R2 Binding names must match:
     - NETWORK_MAP_BUCKET (network-map)
     - ORG_MAP_BUCKET (organization-map)
     - ORG_PINS_BUCKET (disaster-data)
6. (Optional) Attach Routes on your Zone to expose custom paths like `api.tbc.city/...`.

Each worker folder contains its own `wrangler.toml` and `src/index.js` (your code).

## Local dev

```bash
cd workers/network-map
npx wrangler dev
```
