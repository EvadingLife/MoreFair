package de.kaliburg.morefair.dto;

import de.kaliburg.morefair.game.message.MessageEntity;
import de.kaliburg.morefair.game.message.MessageDTO;
import de.kaliburg.morefair.game.ladder.LadderEntity;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class ChatDTO {
    private final Integer currentChatNumber;
    private final List<MessageDTO> messages = new ArrayList<>();

    public ChatDTO(LadderEntity ladder) {
        currentChatNumber = ladder.getNumber();
        List<MessageEntity> sortedMessages = ladder.getMessages();
        sortedMessages.sort((o1, o2) -> o2.getCreatedOn().compareTo(o1.getCreatedOn()));
        sortedMessages = sortedMessages.subList(0, Math.min(30, sortedMessages.size()));
        for (MessageEntity m : sortedMessages) {
            messages.add(m.convertToDTO());
        }
    }
}
