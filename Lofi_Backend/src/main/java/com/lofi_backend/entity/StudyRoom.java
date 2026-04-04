package com.lofi_backend.entity;

import java.util.HashSet;
import java.util.Set;

public class StudyRoom {
    public String code;
    public Set<String> users = new HashSet<>();
}
