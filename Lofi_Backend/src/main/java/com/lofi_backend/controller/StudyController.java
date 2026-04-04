package com.lofi_backend.controller;

import com.lofi_backend.entity.StudyRoom;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.stereotype.Controller;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class StudyController {

    private final Map<String, StudyRoom> rooms = new ConcurrentHashMap<>();

    @MessageMapping("/create")
    @SendTo("/topic/room-created")
    public StudyRoom createRoom(String username) {
        String code = UUID.randomUUID().toString().substring(0,8);
        StudyRoom room = new StudyRoom();
        room.code = code;
        room.users.add(username);
        rooms.put(code, room);
        return room;
    }

    @MessageMapping("/join")
    @SendTo("/topic/room-joined")
    public StudyRoom joinRoom(JoinRequest req) {
        StudyRoom room = rooms.get(req.code);
        if (room != null) {
            room.users.add(req.user);
        }
        return room;
    }

    public static class JoinRequest {
        public String code;
        public String user;
    }
}
