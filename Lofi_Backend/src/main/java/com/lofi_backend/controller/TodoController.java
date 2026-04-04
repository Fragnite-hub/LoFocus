package com.lofi_backend.controller;

import com.lofi_backend.entity.Todo;
import com.lofi_backend.repository.TodoRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/todos")
@CrossOrigin(origins = "*")
public class TodoController {

    private final TodoRepository repo;

    public TodoController(TodoRepository repo) {
        this.repo = repo;
    }

    // GET all todos
    @GetMapping
    public List<Todo> getAll() {
        return repo.findAll();
    }

    // CREATE a todo
    @PostMapping
    public Todo create(@RequestBody Todo todo) {
        return repo.save(todo);
    }

    // UPDATE a todo
    @PutMapping("/{id}")
    public Todo update(@PathVariable Long id, @RequestBody Todo updated) {
        Todo t = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Todo not found"));

        t.setTitle(updated.getTitle());
        t.setContent(updated.getContent());
        t.setCompleted(updated.isCompleted());
        t.setCategory(updated.getCategory());
        t.setPriority(updated.getPriority());

        return repo.save(t);
    }

    // DELETE a todo
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repo.deleteById(id);
    }
}
