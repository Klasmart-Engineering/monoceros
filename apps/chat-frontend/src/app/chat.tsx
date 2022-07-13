import { useState } from "react";
import { useMessages, useSendMessage, useSetName } from "./networkStateProvider";

export const Chat = () => {
    const [chatMessage, setChatMessage] = useState('')
    const [nameInput, setNameInput] = useState('')
    const messages = useMessages();
    const sendChatMessage = useSendMessage();
    const setName = useSetName();
    return (
        <>
            <div />
            {messages.map(m => <div>{new Date(m.timestamp).toLocaleTimeString()} {m.name}: {m.message}</div>)}
            <br/>
            <input
                onChange={e => setChatMessage(e.target.value)}
                onKeyDown={e => {
                    if(e.key !== "Enter") { return; }
                    sendChatMessage(chatMessage);
                    setChatMessage('');
                }}
                value={chatMessage}
            />
            <br />
            <br />
            Set Name:
            <input
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => {
                    if(e.key !== "Enter") { return; }
                    setName(nameInput)
                    setNameInput('');
                }}
                value={nameInput}
            />
        </>
    );
}
