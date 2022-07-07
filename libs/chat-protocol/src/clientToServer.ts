/* eslint-disable @typescript-eslint/ban-types */
export type ChatResponse = {
    // Response
    getUsers?: GetUsersResponse,
    setName?: SetNameResponse,
    sendMessage?: SendMessageResponse,

    // Notifications
    chatMessage?: ChatMessage,
}

export type GetUsersResponse = {}

export type SetNameResponse = {}

export type SendMessageResponse = {}

export type ChatMessage = {
    timestamp: number,
    name: string,
    message: string,
}