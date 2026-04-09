package com.lofi_backend.controller;

import com.lofi_backend.entity.Todo;
import com.lofi_backend.repository.TodoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/todos")
@CrossOrigin(origins = "*")
public class TodoController {

    private final TodoRepository repo;

    public TodoController(TodoRepository repo) {
        this.repo = repo;
    }

    /** GET /api/todos — returns only todos belonging to this client */
    @GetMapping
    public List<Todo> getAll(@RequestHeader(value = "X-Client-Id", required = false) String clientId) {
        if (clientId == null || clientId.isBlank()) return Collections.emptyList();
        return repo.findByClientId(clientId);
    }

    /** POST /api/todos — creates a todo scoped to this client */
    @PostMapping
    public Todo create(
            @RequestHeader(value = "X-Client-Id", required = false) String clientId,
            @RequestBody Todo todo) {
        if (clientId != null && !clientId.isBlank()) {
            todo.setClientId(clientId);
        }
        return repo.save(todo);
    }

    /** PUT /api/todos/{id} — only allows updating own todos */
    @PutMapping("/{id}")
    public ResponseEntity<Todo> update(
            @RequestHeader(value = "X-Client-Id", required = false) String clientId,
            @PathVariable Long id,
            @RequestBody Todo updated) {
        Todo t = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Todo not found"));

        // Prevent cross-user modification
        if (clientId == null || !clientId.equals(t.getClientId())) {
            return ResponseEntity.status(403).build();
        }

        t.setTitle(updated.getTitle());
        t.setContent(updated.getContent());
        t.setCompleted(updated.isCompleted());
        t.setCategory(updated.getCategory());
        t.setPriority(updated.getPriority());

        return ResponseEntity.ok(repo.save(t));
    }

    /** DELETE /api/todos/{id} — only allows deleting own todos */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @RequestHeader(value = "X-Client-Id", required = false) String clientId,
            @PathVariable Long id) {
        Todo t = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Todo not found"));

        // Prevent cross-user deletion
        if (clientId == null || !clientId.equals(t.getClientId())) {
            return ResponseEntity.status(403).build();
        }

        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
