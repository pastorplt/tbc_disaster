// disaster-data worker (updated fields)
// Routes you attach to this Worker:
//   GET  /disaster/org_points.geojson
//   POST /disaster/admin/regenerate
//   GET  /disaster/ok
//
// Env vars (Settings → Variables/Secrets):
//   AIRTABLE_TOKEN, AIRTABLE_BASE_ID, REGEN_TOKEN
//   ORG_TABLE_NAME (default "Master List")
//   FIELD_LAT (default "Latitude"), FIELD_LON (default "Longitude")
//   (optional) AIRTABLE_VIEW_NAME
//
// R2 binding (Settings → Bindings → R2):
//   ORG_PINS_BUCKET  -> your bucket (object key: org_points.geojson)

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (request.method === "OPTIONS") return withCORS(new Response(null, { status: 204 }));

    try {
      if (request.method === "GET" && pathname === "/disaster/org_points.geojson") {
        const obj = await env.ORG_PINS_BUCKET.get("org_points.geojson");
        if (!obj) return withCORS(json({ error: "Points GeoJSON not generated yet" }, 404));
        return withCORS(new Response(obj.body, {
          headers: {
            "Content-Type": "application/geo+json; charset=utf-8",
            "Cache-Control": "public, max-age=300",
            "X-Served-From": "R2"
          }
        }));
      }

      if (request.method === "POST" && pathname === "/disaster/admin/regenerate") {
        const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
        if (!token || token !== env.REGEN_TOKEN) return withCORS(json({ error: "Unauthorized" }, 401));

        const tableName = env.ORG_TABLE_NAME || "Master List";
        const fieldLat  = env.FIELD_LAT || "Latitude";
        const fieldLon  = env.FIELD_LON || "Longitude";

        // Only request the fields you actually have (plus lat/lon)
        const records = await fetchAllAirtableRecords(env, tableName, [
          fieldLat, fieldLon,
          "Organization Name",
          "Website",
          "Organization Type",
          "Full Address",
          "Disaster Contact",
          "Disaster Email",
          "Disaster Phone",
          "Regular Services",
          "Disaster Services",
          "Physical Resources"
        ]);

        const features = [];
        for (const r of records) {
          const f = r.fields || {};
          const lat = toNum(f[fieldLat]);
          const lon = toNum(f[fieldLon]);
          if (!isFinite(lat) || !isFinite(lon)) continue;

          features.push({
            type: "Feature",
            geometry: { type: "Point", coordinates: [lon, lat] }, // [lon, lat]
            properties: {
              id: r.id,
              organization_name: normalizeValue(f["Organization Name"]),
              website:           normalizeValue(f["Website"]),
              organization_type: normalizeValue(f["Organization Type"]),
              full_address:      normalizeValue(f["Full Address"]),
              disaster_contact:  normalizeValue(f["Disaster Contact"]),
              disaster_email:    normalizeValue(f["Disaster Email"]),
              disaster_phone:    normalizeValue(f["Disaster Phone"]),
              regular_services:  normalizeValue(f["Regular Services"]),
              disaster_services: normalizeValue(f["Disaster Services"]),
              physical_resources:normalizeValue(f["Physical Resources"])
            }
          });
        }

        const fc = JSON.stringify({ type: "FeatureCollection", features });

        await env.ORG_PINS_BUCKET.put("org_points.geojson", fc, {
          httpMetadata: {
            contentType: "application/geo+json; charset=utf-8",
            cacheControl: "public, max-age=60"
          }
        });

        return withCORS(json({ ok: true, features: features.length, updatedAt: new Date().toISOString() }));
      }

      if (request.method === "GET" && pathname === "/disaster/ok") {
        return withCORS(textResponse("OK"));
      }

      return withCORS(json({ error: "Not found" }, 404));
    } catch (err) {
      return withCORS(json({ error: String(err?.message || err) }, 500));
    }
  }
};

/* ---------------- Airtable helpers ---------------- */

async function fetchAllAirtableRecords(env, tableName, fields = []) {
  const base = env.AIRTABLE_BASE_ID;
  const key  = env.AIRTABLE_TOKEN;
  const api  = new URL(`https://api.airtable.com/v0/${base}/${encodeURIComponent(tableName)}`);

  api.searchParams.set("pageSize", "100");
  if (env.AIRTABLE_VIEW_NAME) api.searchParams.set("view", env.AIRTABLE_VIEW_NAME);
  for (const f of fields) if (f) api.searchParams.append("fields[]", f);

  const out = [];
  let offset;
  while (true) {
    const url = new URL(api);
    if (offset) url.searchParams.set("offset", offset);

    const resp = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
    if (!resp.ok) throw new Error(`Airtable error ${resp.status}: ${await resp.text()}`);
    const data = await resp.json();

    if (data.records?.length) out.push(...data.records);
    if (data.offset) offset = data.offset; else break;
  }
  return out;
}

/* ---------------- small utils ---------------- */

function toNum(v) { if (v == null) return NaN; return Number(typeof v === "string" ? v.trim() : v); }

function normalizeValue(v) {
  if (v == null) return "";
  if (Array.isArray(v)) return [...new Set(v.map(normalizeValue))].filter(Boolean).join(", ");
  if (typeof v === "object") {
    const cand = v.email ?? v.name ?? v.text ?? v.value ?? null;
    if (cand != null) return String(cand).trim();
    return Object.values(v).map(normalizeValue).filter(Boolean).join(", ");
  }
  return String(v).trim();
}

function withCORS(res) {
  const h = new Headers(res.headers);
  h.set("Access-Control-Allow-Origin", "*");
  h.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  h.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
  h.set("Vary", "Origin");
  return new Response(res.body, { status: res.status, headers: h });
}
function textResponse(s, status = 200) {
  return new Response(s, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}
