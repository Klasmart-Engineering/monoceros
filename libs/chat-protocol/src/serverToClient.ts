/* eslint-disable @typescript-eslint/ban-types */
export type ChatRequest = {
    getUsers?: GetUsersRequest,
    setName?: SetNameRequest,
    sendMessage?: SendMessageRequest,
}

export type GetUsersRequest = {}

export type SetNameRequest = {
    name: string,
}

export type SendMessageRequest = {
    contents: string,
}