import { useState } from "react";
import { useMessages, useSendMessage } from "./networkStateProvider";

export const Chat = () => {
    const [value, setValue] = useState('')
    const messages = useMessages();
    const sendChatMessage = useSendMessage();
    return (
        <>
            <div />
            {messages.map(m => <div>{new Date(m.timestamp).toLocaleTimeString()} {m.name}: {m.message}</div>)}
            <br/>
            <input
                onChange={e => setValue(e.target.value)}
                onKeyDown={e => {
                    if(e.key !== "Enter") { return; }
                    sendChatMessage(value);
                    setValue('');
                }}
                value={value}
            />
        </>
    );
}
