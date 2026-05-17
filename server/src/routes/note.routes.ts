import { Router } from "express";
import { authenticate } from "../middleware";
import {
  create,
  list,
  getById,
  update,
  remove,
  restore,
  permanentDelete,
  versions,
} from "../controllers/note.controller";
import {
  share,
  updatePermission,
  revoke,
  collaborators,
} from "../controllers/share.controller";

const router = Router();

// All note routes require authentication
router.use(authenticate as any);

// ═══════════════════════════════════════════════
//  NOTES CRUD
// ═══════════════════════════════════════════════

/**
 * @swagger
 * /notes:
 *   post:
 *     tags: [Notes]
 *     summary: Create a new note
 *     description: Creates a note owned by the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateNoteRequest'
 *     responses:
 *       201:
 *         description: Note created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post("/", create);

/**
 * @swagger
 * /notes:
 *   get:
 *     tags: [Notes]
 *     summary: List user's notes (owned + shared)
 *     description: |
 *       Returns paginated, non-deleted notes that the user owns OR that have been shared with them.
 *       Each note includes sharing metadata:
 *       - `permission`: OWNER, READ, or EDIT
 *       - `sharedBy`: owner info (for shared notes)
 *       - `sharedWith`: collaborator list (for owned notes)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Optional search term for title and content
 *     responses:
 *       200:
 *         description: Paginated list of notes with sharing metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NoteWithSharing'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/", list);

/**
 * @swagger
 * /notes/{id}:
 *   get:
 *     tags: [Notes]
 *     summary: Get a note by ID
 *     description: |
 *       Returns a single note if the user is the owner or has shared access (READ or EDIT).
 *       Includes sharing metadata.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Note UUID
 *     responses:
 *       200:
 *         description: Note found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NoteWithSharing'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: User does not have access to this note
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/:id", getById);

/**
 * @swagger
 * /notes/{id}:
 *   put:
 *     tags: [Notes]
 *     summary: Update a note
 *     description: |
 *       Updates a note. Allowed for:
 *       - **Owner**: can update title, content, isPinned, isArchived
 *       - **EDIT users**: can update title and content only
 *       - **READ users**: rejected with 403
 *
 *       Saves a version snapshot before applying changes.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Note UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateNoteRequest'
 *     responses:
 *       200:
 *         description: Note updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NoteWithSharing'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: User does not have EDIT permission
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put("/:id", update);

/**
 * @swagger
 * /notes/{id}:
 *   delete:
 *     tags: [Notes]
 *     summary: Soft-delete a note
 *     description: Marks a note as deleted (soft delete). **Owner only** — shared users cannot delete.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Note UUID
 *     responses:
 *       204:
 *         description: Note deleted successfully (no content)
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only the note owner can delete
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete("/:id", remove);

// ═══════════════════════════════════════════════
//  TRASH: RESTORE & PERMANENT DELETE
// ═══════════════════════════════════════════════

/**
 * @swagger
 * /notes/{id}/restore:
 *   post:
 *     tags: [Notes]
 *     summary: Restore a note from trash
 *     description: |
 *       Restores a soft-deleted note. **Owner only.**
 *       The note must be in trash (isDeleted: true).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Note UUID
 *     responses:
 *       200:
 *         description: Note restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Note restored successfully"
 *                 note:
 *                   $ref: '#/components/schemas/NoteWithSharing'
 *       400:
 *         description: Note is not in trash
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only the note owner can restore
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post("/:id/restore", restore);

/**
 * @swagger
 * /notes/{id}/permanent:
 *   delete:
 *     tags: [Notes]
 *     summary: Permanently delete a note
 *     description: |
 *       Hard-deletes a note and all its associated data (versions, shares).
 *       **Owner only.** The note must be in trash first.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Note UUID
 *     responses:
 *       204:
 *         description: Note permanently deleted (no content)
 *       400:
 *         description: Note must be in trash before permanent deletion
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only the note owner can permanently delete
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete("/:id/permanent", permanentDelete);

// ═══════════════════════════════════════════════
//  VERSION HISTORY
// ═══════════════════════════════════════════════

/**
 * @swagger
 * /notes/{id}/versions:
 *   get:
 *     tags: [Notes]
 *     summary: Get version history for a note
 *     description: |
 *       Returns paginated version history (newest first).
 *       Accessible by owner and shared users.
 *       Each version is an immutable snapshot taken before an edit.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Note UUID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Version history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 versions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NoteVersion'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: User does not have access
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/:id/versions", versions);

// ═══════════════════════════════════════════════
//  SHARING & COLLABORATION
// ═══════════════════════════════════════════════

/**
 * @swagger
 * /notes/{id}/share:
 *   post:
 *     tags: [Sharing]
 *     summary: Share a note with another user
 *     description: |
 *       Shares a note with a registered user by email. **Owner only.**
 *       Accepts an optional `permission` field (defaults to READ).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Note UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShareNoteRequest'
 *     responses:
 *       200:
 *         description: Note shared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Note shared successfully"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only the note owner can share
 *       404:
 *         description: Note or recipient user not found
 *       409:
 *         description: Note already shared with this user
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post("/:id/share", share);

/**
 * @swagger
 * /notes/{id}/collaborators:
 *   get:
 *     tags: [Sharing]
 *     summary: Get collaborators for a note
 *     description: Returns the owner and all users the note is shared with. **Owner only.**
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Note UUID
 *     responses:
 *       200:
 *         description: Collaborators list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 owner:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                 collaborators:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                         format: uuid
 *                       email:
 *                         type: string
 *                       name:
 *                         type: string
 *                       permission:
 *                         type: string
 *                         enum: [READ, EDIT]
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only the note owner can view collaborators
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get("/:id/collaborators", collaborators);

/**
 * @swagger
 * /notes/{id}/share/{sharedUserId}:
 *   patch:
 *     tags: [Sharing]
 *     summary: Update a shared user's permission
 *     description: Changes the permission (READ or EDIT) for a user the note is shared with. **Owner only.**
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Note UUID
 *       - in: path
 *         name: sharedUserId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User UUID whose permission is being changed
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [permission]
 *             properties:
 *               permission:
 *                 type: string
 *                 enum: [READ, EDIT]
 *                 description: New permission level
 *     responses:
 *       200:
 *         description: Permission updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Permission updated successfully"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only the note owner can update permissions
 *       404:
 *         description: Note or share entry not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch("/:id/share/:sharedUserId", updatePermission);

/**
 * @swagger
 * /notes/{id}/share/{sharedUserId}:
 *   delete:
 *     tags: [Sharing]
 *     summary: Revoke a shared user's access
 *     description: Removes a user's access to a shared note. **Owner only.**
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Note UUID
 *       - in: path
 *         name: sharedUserId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User UUID whose access is being revoked
 *     responses:
 *       200:
 *         description: Access revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Access revoked successfully"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only the note owner can revoke access
 *       404:
 *         description: Note or share entry not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete("/:id/share/:sharedUserId", revoke);

export default router;
