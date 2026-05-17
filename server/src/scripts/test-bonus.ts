/**
 * Comprehensive bonus feature test script.
 * Tests: pagination, search, rate-limit headers, share permissions,
 *        version history, trash/restore/permanent-delete.
 */

const BASE = "http://localhost:3000";

async function api(method: string, path: string, token?: string, body?: any) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const rateLimitRemaining = res.headers.get("ratelimit-remaining");
  const rateLimitLimit = res.headers.get("ratelimit-limit");
  let data: any = null;
  const text = await res.text();
  try { data = JSON.parse(text); } catch {}
  return { status: res.status, data, rateLimitRemaining, rateLimitLimit, headers: res.headers };
}

function pass(label: string) { console.log(`  ✅ ${label}`); }
function fail(label: string, detail?: string) { console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ""}`); }
function section(title: string) { console.log(`\n${"═".repeat(50)}\n  ${title}\n${"═".repeat(50)}`); }

async function main() {
  const ts = Date.now();
  const userA = { email: `bonusA_${ts}@test.com`, password: "test123" };
  const userB = { email: `bonusB_${ts}@test.com`, password: "test456" };

  // ── Setup: Register & Login two users ──
  section("SETUP: Register & Login");
  
  let r = await api("POST", "/register", undefined, userA);
  r.status === 201 ? pass(`Register User A: ${r.status}`) : fail(`Register User A: ${r.status}`, JSON.stringify(r.data));
  
  r = await api("POST", "/register", undefined, userB);
  r.status === 201 ? pass(`Register User B: ${r.status}`) : fail(`Register User B: ${r.status}`, JSON.stringify(r.data));

  r = await api("POST", "/login", undefined, userA);
  const tokenA = r.data?.access_token;
  tokenA ? pass(`Login User A — got token`) : fail(`Login User A`, JSON.stringify(r.data));

  r = await api("POST", "/login", undefined, userB);
  const tokenB = r.data?.access_token;
  tokenB ? pass(`Login User B — got token`) : fail(`Login User B`, JSON.stringify(r.data));

  // ── Create several notes for pagination ──
  section("1. PAGINATION");

  const noteIds: string[] = [];
  for (let i = 1; i <= 5; i++) {
    r = await api("POST", "/notes", tokenA, { title: `Paginate Note ${i}`, content: `Content for note ${i}` });
    if (r.status === 201 && r.data?.id) {
      noteIds.push(r.data.id);
    }
  }
  pass(`Created ${noteIds.length} notes`);

  // Test flat array (no pagination params)
  r = await api("GET", "/notes", tokenA);
  if (r.status === 200 && Array.isArray(r.data)) {
    pass(`GET /notes returns flat array (length: ${r.data.length})`);
  } else {
    fail(`GET /notes flat array`, `status=${r.status}, isArray=${Array.isArray(r.data)}`);
  }

  // Test paginated response
  r = await api("GET", "/notes?page=1&limit=2", tokenA);
  if (r.status === 200 && r.data?.notes && r.data?.meta) {
    pass(`GET /notes?page=1&limit=2 — paginated format (${r.data.notes.length} notes, total: ${r.data.meta.total})`);
    if (r.data.meta.totalPages > 1) {
      pass(`Multiple pages exist (totalPages: ${r.data.meta.totalPages})`);
    } else {
      fail(`Expected multiple pages`);
    }
  } else {
    fail(`Paginated response`, JSON.stringify(r.data).substring(0, 200));
  }

  // Test page 2
  r = await api("GET", "/notes?page=2&limit=2", tokenA);
  if (r.status === 200 && r.data?.notes?.length > 0) {
    pass(`Page 2 has ${r.data.notes.length} notes`);
  } else {
    fail(`Page 2`, JSON.stringify(r.data).substring(0, 200));
  }

  // ── Full-text search ──
  section("2. FULL-TEXT SEARCH");

  r = await api("GET", "/search?q=Paginate", tokenA);
  if (r.status === 200 && r.data?.notes?.length > 0) {
    pass(`GET /search?q=Paginate — found ${r.data.notes.length} results`);
  } else {
    fail(`Search`, JSON.stringify(r.data).substring(0, 200));
  }

  // Search with no results
  r = await api("GET", "/search?q=xyznonexistent", tokenA);
  if (r.status === 200 && r.data?.notes?.length === 0) {
    pass(`Search no results — returns empty array`);
  } else {
    fail(`Search no results`, JSON.stringify(r.data).substring(0, 200));
  }

  // Search without query
  r = await api("GET", "/search", tokenA);
  if (r.status === 400) {
    pass(`Search without query — 400 Bad Request`);
  } else {
    fail(`Search without query`, `status=${r.status}`);
  }

  // ── Rate Limiting Headers ──
  section("3. RATE LIMITING");

  r = await api("GET", "/notes", tokenA);
  const rlHeader = r.headers.get("ratelimit") || r.headers.get("ratelimit-policy");
  if (rlHeader) {
    pass(`Rate limit headers present — RateLimit: ${r.headers.get("ratelimit")}, Policy: ${r.headers.get("ratelimit-policy")}`);
  } else {
    fail(`Rate limit headers missing`);
  }

  // ── Share with Permissions ──
  section("4. SHARE WITH PERMISSIONS (READ & EDIT)");

  const readNoteId = noteIds[0];
  const editNoteId = noteIds[1];

  // Share note 1 with READ permission
  r = await api("POST", `/notes/${readNoteId}/share`, tokenA, { share_with_email: userB.email, permission: "READ" });
  r.status === 200 ? pass(`Share note with READ permission: ${r.status}`) : fail(`Share READ`, JSON.stringify(r.data));

  // Share note 2 with EDIT permission
  r = await api("POST", `/notes/${editNoteId}/share`, tokenA, { share_with_email: userB.email, permission: "EDIT" });
  r.status === 200 ? pass(`Share note with EDIT permission: ${r.status}`) : fail(`Share EDIT`, JSON.stringify(r.data));

  // User B: check READ note via GET /notes/:id
  r = await api("GET", `/notes/${readNoteId}`, tokenB);
  if (r.status === 200 && r.data?.permission === "READ") {
    pass(`User B sees READ note — permission: ${r.data.permission}`);
  } else {
    fail(`User B READ note`, `status=${r.status}, permission=${r.data?.permission}`);
  }

  // User B: check EDIT note via GET /notes/:id
  r = await api("GET", `/notes/${editNoteId}`, tokenB);
  if (r.status === 200 && r.data?.permission === "EDIT") {
    pass(`User B sees EDIT note — permission: ${r.data.permission}`);
  } else {
    fail(`User B EDIT note`, `status=${r.status}, permission=${r.data?.permission}`);
  }

  // User B: try to update READ note (should fail)
  r = await api("PUT", `/notes/${readNoteId}`, tokenB, { title: "Hacked Title" });
  if (r.status === 403) {
    pass(`User B cannot edit READ note — 403 Forbidden`);
  } else {
    fail(`READ note edit guard`, `status=${r.status}`);
  }

  // User B: update EDIT note (should succeed)
  r = await api("PUT", `/notes/${editNoteId}`, tokenB, { title: "Updated by User B" });
  if (r.status === 200 && r.data?.title === "Updated by User B") {
    pass(`User B can edit EDIT note — title updated`);
  } else {
    fail(`EDIT note update`, `status=${r.status}, title=${r.data?.title}`);
  }

  // User B: try to delete shared note (should fail — owner only)
  r = await api("DELETE", `/notes/${editNoteId}`, tokenB);
  if (r.status === 403) {
    pass(`User B cannot delete shared note — 403 Forbidden`);
  } else {
    fail(`Delete guard`, `status=${r.status}`);
  }

  // User B: try to pin shared note (EDIT user, should fail)
  r = await api("PUT", `/notes/${editNoteId}`, tokenB, { isPinned: true });
  if (r.status === 403) {
    pass(`User B cannot pin shared note — 403 Forbidden`);
  } else {
    fail(`Pin guard`, `status=${r.status}`);
  }

  // ── Version History ──
  section("5. VERSION HISTORY");

  // The EDIT note was updated by User B, so version 1 should exist
  r = await api("GET", `/notes/${editNoteId}/versions`, tokenA);
  if (r.status === 200 && r.data?.versions?.length > 0) {
    const v = r.data.versions[0];
    pass(`Version history has ${r.data.versions.length} version(s) — v${v.version}: "${v.title}"`);
  } else {
    fail(`Version history`, `status=${r.status}, versions=${r.data?.versions?.length}`);
  }

  // User B (EDIT shared) can also see versions
  r = await api("GET", `/notes/${editNoteId}/versions`, tokenB);
  if (r.status === 200) {
    pass(`Shared user can view version history`);
  } else {
    fail(`Shared user version access`, `status=${r.status}`);
  }

  // Make another edit to create version 2
  r = await api("PUT", `/notes/${editNoteId}`, tokenA, { content: "Version 3 content" });
  r = await api("GET", `/notes/${editNoteId}/versions`, tokenA);
  if (r.status === 200 && r.data?.versions?.length >= 2) {
    pass(`Multiple versions exist (${r.data.versions.length} versions)`);
    pass(`Version pagination meta: page=${r.data.meta.page}, total=${r.data.meta.total}`);
  } else {
    fail(`Multiple versions`, `count=${r.data?.versions?.length}`);
  }

  // ── Trash, Restore, Permanent Delete ──
  section("6. TRASH / RESTORE / PERMANENT DELETE");

  const trashNoteId = noteIds[2];

  // Soft delete
  r = await api("DELETE", `/notes/${trashNoteId}`, tokenA);
  r.status === 204 ? pass(`Soft delete: ${r.status}`) : fail(`Soft delete`, `status=${r.status}`);

  // Check it's in trash
  r = await api("GET", "/notes?page=1&limit=100&deleted=true", tokenA);
  const inTrash = r.data?.notes?.some((n: any) => n.id === trashNoteId);
  inTrash ? pass(`Note appears in trash list`) : fail(`Note not in trash`, JSON.stringify(r.data?.notes?.map((n:any)=>n.id)));

  // Check it's NOT in active notes
  r = await api("GET", "/notes", tokenA);
  const inActive = r.data?.some?.((n: any) => n.id === trashNoteId);
  !inActive ? pass(`Note NOT in active notes list`) : fail(`Note still in active list`);

  // Try to delete already-trashed note again
  r = await api("DELETE", `/notes/${trashNoteId}`, tokenA);
  if (r.status === 400) {
    pass(`Cannot re-delete trashed note — 400: ${r.data?.message}`);
  } else {
    fail(`Re-delete guard`, `status=${r.status}`);
  }

  // Restore
  r = await api("POST", `/notes/${trashNoteId}/restore`, tokenA);
  if (r.status === 200 && r.data?.note) {
    pass(`Restored note: ${r.status} — title: "${r.data.note.title}"`);
  } else {
    fail(`Restore`, `status=${r.status}`);
  }

  // Restore again (should fail — not in trash)
  r = await api("POST", `/notes/${trashNoteId}/restore`, tokenA);
  if (r.status === 400) {
    pass(`Cannot restore non-trashed note — 400: ${r.data?.message}`);
  } else {
    fail(`Restore guard`, `status=${r.status}`);
  }

  // Delete again for permanent delete test
  await api("DELETE", `/notes/${trashNoteId}`, tokenA);

  // Permanent delete
  r = await api("DELETE", `/notes/${trashNoteId}/permanent`, tokenA);
  r.status === 204 ? pass(`Permanent delete: ${r.status}`) : fail(`Permanent delete`, `status=${r.status}`);

  // Verify it's truly gone
  r = await api("GET", `/notes/${trashNoteId}`, tokenA);
  if (r.status === 404) {
    pass(`Permanently deleted note is gone — 404`);
  } else {
    fail(`Note still exists`, `status=${r.status}`);
  }

  // Try permanent delete on non-trashed note
  r = await api("DELETE", `/notes/${noteIds[3]}/permanent`, tokenA);
  if (r.status === 400) {
    pass(`Cannot permanent-delete active note — 400: ${r.data?.message}`);
  } else {
    fail(`Permanent delete guard`, `status=${r.status}`);
  }

  // ── Edge cases ──
  section("7. EDGE CASE VALIDATION");

  // Share with yourself
  r = await api("POST", `/notes/${noteIds[3]}/share`, tokenA, { share_with_email: userA.email });
  if (r.status === 400) {
    pass(`Cannot share with yourself — 400: ${r.data?.message}`);
  } else {
    fail(`Self-share guard`, `status=${r.status}`);
  }

  // Share with non-existent email
  r = await api("POST", `/notes/${noteIds[3]}/share`, tokenA, { share_with_email: "nobody@nowhere.com" });
  if (r.status === 404) {
    pass(`Share with non-existent user — 404: ${r.data?.message}`);
  } else {
    fail(`Non-existent share`, `status=${r.status}`);
  }

  // Access note without token
  r = await api("GET", `/notes/${noteIds[3]}`);
  if (r.status === 401) {
    pass(`No token — 401 Unauthorized`);
  } else {
    fail(`Auth guard`, `status=${r.status}`);
  }

  // Invalid note ID
  r = await api("GET", `/notes/not-a-uuid`, tokenA);
  if (r.status === 404) {
    pass(`Invalid UUID — 404`);
  } else {
    fail(`Invalid UUID`, `status=${r.status}`);
  }

  // Empty body on create
  r = await api("POST", "/notes", tokenA, {});
  if (r.status === 400) {
    pass(`Empty body — 400: ${r.data?.message}`);
  } else {
    fail(`Empty body guard`, `status=${r.status}`);
  }

  console.log("\n" + "═".repeat(50));
  console.log("  ALL TESTS COMPLETE");
  console.log("═".repeat(50) + "\n");
}

main().catch(console.error);
