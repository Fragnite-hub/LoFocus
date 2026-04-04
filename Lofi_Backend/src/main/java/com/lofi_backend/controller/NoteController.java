package com.lofi_backend.controller;

import com.lofi_backend.entity.Note;
import com.lofi_backend.repository.NoteRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
@CrossOrigin(origins = "*")
public class NoteController {

    private final NoteRepository repo;

    public NoteController(NoteRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Note> getAll() {
        return repo.findAllByOrderByUpdatedAtDesc();
    }

    @PostMapping
    public Note create(@RequestBody Note note) {
        return repo.save(note);
    }

    @PutMapping("/{id}")
    public Note update(@PathVariable Long id, @RequestBody Note updated) {
        Note n = repo.findById(id).orElseThrow(() -> new RuntimeException("Note not found"));
        n.setTitle(updated.getTitle());
        n.setContent(updated.getContent());
        return repo.save(n);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repo.deleteById(id);
    }
}

