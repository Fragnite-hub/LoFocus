package com.lofi_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lofi_backend.entity.Todo;

public interface TodoRepository extends JpaRepository<Todo, Long> {}

