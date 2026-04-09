package com.lofi_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lofi_backend.entity.Todo;
import java.util.List;

public interface TodoRepository extends JpaRepository<Todo, Long> {
    List<Todo> findByClientIdAndCompletedFalseOrderByCreatedAtAsc(String clientId);
    List<Todo> findByClientId(String clientId);
}

