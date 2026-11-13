const express = require('express');
const mongoose = require('mongoose');
const Note = require('../models/Note');
const appEvents = require('../events/appEvents');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate); // every notes route is protected

// Loads a note and checks ownership (admins may access any note).
async function loadOwnedNote(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ message: 'Invalid note id' });
    return null;
  }
  const note = await Note.findById(req.params.id);
  if (!note) {
    res.status(404).json({ message: 'Note not found' });
    return null;
  }
  if (note.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ message: 'You do not own this note' });
    return null;
  }
  return note;
}

// POST /api/notes
router.post('/', async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ message: 'title and content are required' });
  }
  const note = await Note.create({ title, content, owner: req.user.id });
  appEvents.emit('note:created', note);
  res.status(201).json(note);
});

// GET /api/notes  (own notes; admin sees all)
router.get('/', async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { owner: req.user.id };
  const notes = await Note.find(filter).sort({ createdAt: 1 });
  res.json(notes);
});

// GET /api/notes/:id
router.get('/:id', async (req, res) => {
  const note = await loadOwnedNote(req, res);
  if (note) res.json(note);
});

// PUT /api/notes/:id
router.put('/:id', async (req, res) => {
  const note = await loadOwnedNote(req, res);
  if (!note) return;
  if (req.body.title !== undefined) note.title = req.body.title;
  if (req.body.content !== undefined) note.content = req.body.content;
  await note.save();
  res.json(note);
});

// DELETE /api/notes/:id
router.delete('/:id', async (req, res) => {
  const note = await loadOwnedNote(req, res);
  if (!note) return;
  await note.deleteOne();
  appEvents.emit('note:deleted', note._id);
  res.json({ message: 'Note deleted' });
});

module.exports = router;
