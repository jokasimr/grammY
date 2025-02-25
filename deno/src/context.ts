// deno-lint-ignore-file camelcase
import { Api, Other } from './core/api.ts'
import {
    Chat,
    ChatPermissions,
    InlineQueryResult,
    InputFile,
    InputMedia,
    InputMediaAudio,
    InputMediaDocument,
    InputMediaPhoto,
    InputMediaVideo,
    LabeledPrice,
    Message,
    PassportElementError,
    Update,
    User,
    UserFromGetMe,
} from './platform.ts'

type SnakeToCamelCase<S extends string> = S extends `${infer L}_${infer R}`
    ? `${L}${Capitalize<SnakeToCamelCase<R>>}`
    : S
export type AliasProps<U> = {
    [key in string & keyof U as SnakeToCamelCase<key>]: U[key]
}
type RenamedUpdate = AliasProps<Omit<Update, 'update_id'>>

/**
 * When your bot receives a message, Telegram sends an update object to your
 * bot. The update contains information about the chat, the user, and of course
 * the message itself. There a numerous other updates, too:
 * https://core.telegram.org/bots/api#update
 *
 * When grammY receives an update, it wraps this update into a context object
 * for you. Context objects are commonly named `ctx`. A context object does two
 * things:
 * 1. **`ctx.update`** holds the update object that you can use to process the
 *    message. This includes providing useful shortcuts for the update, for
 *    instance, `ctx.msg` is a shortcut that gives you the message object from
 *    the update—no matter whether it is contained in `ctx.update.message`, or
 *    `ctx.update.edited_message`, or `ctx.update.channel_post`, or
 *    `ctx.update.edited_channel_post`.
 * 2. **`ctx.api`** gives you access to the full Telegram Bot API so that you
 *    can directly call any method, such as responding via
 *    `ctx.api.sendMessage`. Also here, the context objects has some useful
 *    shortcuts for you. For instance, if you want to send a message to the same
 *    chat that a message comes from (i.e. just respond to a user) you can call
 *    `ctx.reply`. This is nothing but a wrapper for `ctx.api.sendMessage` with
 *    the right `chat_id` pre-filled for you. Almost all methods of the Telegram
 *    Bot API have their own shortcut directly on the context object, so you
 *    probably never really have to use `ctx.api` at all.
 *
 * This context object is then passed to all of the listeners (called
 * middleware) that you register on your bot. Because this is so useful, the
 * context object is often used to hold more information. One example are
 * sessions (a chat-specific data storage that is stored in a database), and
 * another example is `ctx.match` that is used by `bot.command` and other
 * methods to keep information about how a regular expression was matched.
 *
 * Read up about middleware on the
 * [website](https://grammy.dev/guide/context.html) if you want to know more
 * about the powerful opportunities that lie in context objects, and about how
 * grammY implements them.
 */
export class Context implements RenamedUpdate {
    /**
     * Used by some middleware to store information about how a certain string
     * or regular expression was matched.
     */
    public match?: string | RegExpMatchArray | null

    constructor(
        /**
         * The update object that is contained in the context.
         */
        public readonly update: Update,
        /**
         * An API instance that allows you to call any method of the Telegram
         * Bot API.
         */
        public readonly api: Api,
        /**
         * Information about the bot itself.
         */
        public readonly me: UserFromGetMe
    ) {}

    // UPDATE SHORTCUTS

    /** Alias for `ctx.update.message` */
    get message() {
        return this.update.message
    }
    /** Alias for `ctx.update.edited_message` */
    get editedMessage() {
        return this.update.edited_message
    }
    /** Alias for `ctx.update.channel_post` */
    get channelPost() {
        return this.update.channel_post
    }
    /** Alias for `ctx.update.edited_channel_post` */
    get editedChannelPost() {
        return this.update.edited_channel_post
    }
    /** Alias for `ctx.update.inline_query` */
    get inlineQuery() {
        return this.update.inline_query
    }
    /** Alias for `ctx.update.chosen_inline_result` */
    get chosenInlineResult() {
        return this.update.chosen_inline_result
    }
    /** Alias for `ctx.update.callback_query` */
    get callbackQuery() {
        return this.update.callback_query
    }
    /** Alias for `ctx.update.shipping_query` */
    get shippingQuery() {
        return this.update.shipping_query
    }
    /** Alias for `ctx.update.pre_checkout_query` */
    get preCheckoutQuery() {
        return this.update.pre_checkout_query
    }
    /** Alias for `ctx.update.poll` */
    get poll() {
        return this.update.poll
    }
    /** Alias for `ctx.update.poll_answer` */
    get pollAnswer() {
        return this.update.poll_answer
    }
    /** Alias for `ctx.update.my_chat_member` */
    get myChatMember() {
        return this.update.my_chat_member
    }
    /** Alias for `ctx.update.chat_member` */
    get chatMember() {
        return this.update.chat_member
    }

    // AGGREGATION SHORTCUTS

    /**
     * Get message object from whereever possible. Alias for `ctx.message ??
     * ctx.editedMessage ?? ctx.callbackQuery?.message ?? ctx.channelPost ??
     * ctx.editedChannelPost`
     */
    get msg(): Message | undefined {
        // Keep in sync with types in `filter.ts`.
        return (
            this.message ??
            this.editedMessage ??
            this.callbackQuery?.message ??
            this.channelPost ??
            this.editedChannelPost
        )
    }
    /**
     * Get chat object from whereever possible. Alias for `ctx.msg?.chat`
     */
    get chat(): Chat | undefined {
        // Keep in sync with types in `filter.ts`.
        return this.msg?.chat
    }
    /**
     * Get sender chat object from wherever possible. Alias for `ctx.msg?.sender_chat`.
     */
    get senderChat(): Chat | undefined {
        return this.msg?.sender_chat
    }
    /**
     * Get message author from whereever possible. Alias for `(ctx.callbackQuery
     * ?? ctx.inlineQuery ?? ctx.shippingQuery ?? ctx.preCheckoutQuery ??
     * ctx.chosenInlineResult ?? ctx.msg)?.from`
     */
    get from(): User | undefined {
        // Keep in sync with types in `filter.ts`.
        return (
            this.callbackQuery ??
            this.inlineQuery ??
            this.shippingQuery ??
            this.preCheckoutQuery ??
            this.chosenInlineResult ??
            this.msg
        )?.from
    }
    /**
     * Get inline message ID from whereever possible. Alias for
     * `(ctx.callbackQuery ?? ctx.chosenInlineResult)?.inline_message_id`
     */
    get inlineMessageId(): string | undefined {
        return (
            this.callbackQuery?.inline_message_id ??
            this.chosenInlineResult?.inline_message_id
        )
    }

    // API

    /**
     * Context-aware alias for `sendMessage`. Use this method to send text messages. On success, the sent Message is returned.
     *
     * @param text Text of the message to be sent, 1-4096 characters after entities parsing
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendmessage
     */
    reply(
        text: string,
        other?: Other<'sendMessage', 'text'>,
        signal?: AbortSignal
    ) {
        return this.api.sendMessage(
            orThrow(this.chat, 'sendMessage').id,
            text,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `forwardMessage`. Use this method to forward messages of any kind. Service messages can't be forwarded. On success, the sent Message is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#forwardmessage
     */
    forwardMessage(
        chat_id: number | string,
        other?: Other<'forwardMessage', 'from_chat_id' | 'message_id'>,
        signal?: AbortSignal
    ) {
        return this.api.forwardMessage(
            chat_id,
            orThrow(this.chat, 'forwardMessage').id,
            orThrow(this.msg, 'forwardMessage').message_id,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `copyMessage`. Use this method to copy messages of any kind. Service messages and invoice messages can't be copied. The method is analogous to the method forwardMessage, but the copied message doesn't have a link to the original message. Returns the MessageId of the sent message on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#copymessage
     */
    copyMessage(
        chat_id: number | string,
        other?: Other<'copyMessage', 'from_chat_id' | 'message_id'>,
        signal?: AbortSignal
    ) {
        return this.api.copyMessage(
            chat_id,
            orThrow(this.chat, 'copyMessage').id,
            orThrow(this.msg, 'copyMessage').message_id,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `sendPhoto`. Use this method to send photos. On success, the sent Message is returned.
     *
     * @param photo Photo to send. Pass a file_id as String to send a photo that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a photo from the Internet, or upload a new photo using multipart/form-data. The photo must be at most 10 MB in size. The photo's width and height must not exceed 10000 in total. Width and height ratio must be at most 20.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendphoto
     */
    replyWithPhoto(
        photo: InputFile | string,
        other?: Other<'sendPhoto', 'photo'>,
        signal?: AbortSignal
    ) {
        return this.api.sendPhoto(
            orThrow(this.chat, 'sendPhoto').id,
            photo,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `sendAudio`. Use this method to send audio files, if you want Telegram clients to display them in the music player. Your audio must be in the .MP3 or .M4A format. On success, the sent Message is returned. Bots can currently send audio files of up to 50 MB in size, this limit may be changed in the future.
     *
     * For sending voice messages, use the sendVoice method instead.
     *
     * @param audio Audio file to send. Pass a file_id as String to send an audio file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get an audio file from the Internet, or upload a new one using multipart/form-data.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendaudio
     */
    replyWithAudio(
        audio: InputFile | string,
        other?: Other<'sendAudio', 'audio'>,
        signal?: AbortSignal
    ) {
        return this.api.sendAudio(
            orThrow(this.chat, 'sendAudio').id,
            audio,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `sendDocument`. Use this method to send general files. On success, the sent Message is returned. Bots can currently send files of any type of up to 50 MB in size, this limit may be changed in the future.
     *
     * @param document File to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a file from the Internet, or upload a new one using multipart/form-data.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#senddocument
     */
    replyWithDocument(
        document: InputFile | string,
        other?: Other<'sendDocument', 'document'>,
        signal?: AbortSignal
    ) {
        return this.api.sendDocument(
            orThrow(this.chat, 'sendDocument').id,
            document,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `sendVideo`. Use this method to send video files, Telegram clients support mp4 videos (other formats may be sent as Document). On success, the sent Message is returned. Bots can currently send video files of up to 50 MB in size, this limit may be changed in the future.
     *
     * @param video Video to send. Pass a file_id as String to send a video that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a video from the Internet, or upload a new video using multipart/form-data.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendvideo
     */
    replyWithVideo(
        video: InputFile | string,
        other?: Other<'sendVideo', 'video'>,
        signal?: AbortSignal
    ) {
        return this.api.sendVideo(
            orThrow(this.chat, 'sendVideo').id,
            video,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `sendAnimation`. Use this method to send animation files (GIF or H.264/MPEG-4 AVC video without sound). On success, the sent Message is returned. Bots can currently send animation files of up to 50 MB in size, this limit may be changed in the future.
     *
     * @param animation Animation to send. Pass a file_id as String to send an animation that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get an animation from the Internet, or upload a new animation using multipart/form-data.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendanimation
     */
    replyWithAnimation(
        animation: InputFile | string,
        other?: Other<'sendAnimation', 'animation'>,
        signal?: AbortSignal
    ) {
        return this.api.sendAnimation(
            orThrow(this.chat, 'sendAnimation').id,
            animation,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `sendVoice`. Use this method to send audio files, if you want Telegram clients to display the file as a playable voice message. For this to work, your audio must be in an .OGG file encoded with OPUS (other formats may be sent as Audio or Document). On success, the sent Message is returned. Bots can currently send voice messages of up to 50 MB in size, this limit may be changed in the future.
     *
     * @param voice Audio file to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a file from the Internet, or upload a new one using multipart/form-data.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendvoice
     */
    replyWithVoice(
        voice: InputFile | string,
        other?: Other<'sendVoice', 'voice'>,
        signal?: AbortSignal
    ) {
        return this.api.sendVoice(
            orThrow(this.chat, 'sendVoice').id,
            voice,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `sendVideoNote`. Use this method to send video messages. On success, the sent Message is returned.
     * As of v.4.0, Telegram clients support rounded square mp4 videos of up to 1 minute long.
     *
     * @param video_note Video note to send. Pass a file_id as String to send a video note that exists on the Telegram servers (recommended) or upload a new video using multipart/form-data.. Sending video notes by a URL is currently unsupported
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendvideonote
     */
    replyWithVideoNote(
        video_note: InputFile | string,
        other?: Other<'sendVideoNote', 'video_note'>,
        signal?: AbortSignal
    ) {
        return this.api.sendVideoNote(
            orThrow(this.chat, 'sendVideoNote').id,
            video_note,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `sendMediaGroup`. Use this method to send a group of photos, videos, documents or audios as an album. Documents and audio files can be only grouped in an album with messages of the same type. On success, an array of Messages that were sent is returned.
     *
     * @param media An array describing messages to be sent, must include 2-10 items
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendmediagroup
     */
    replyWithMediaGroup(
        media: ReadonlyArray<
            | InputMediaAudio
            | InputMediaDocument
            | InputMediaPhoto
            | InputMediaVideo
        >,
        other?: Other<'sendMediaGroup', 'media'>,
        signal?: AbortSignal
    ) {
        return this.api.sendMediaGroup(
            orThrow(this.chat, 'sendMediaGroup').id,
            media,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `sendLocation`. Use this method to send point on the map. On success, the sent Message is returned.
     *
     * @param latitude Latitude of the location
     * @param longitude Longitude of the location
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendlocation
     */
    replyWithLocation(
        latitude: number,
        longitude: number,
        other?: Other<'sendLocation', 'latitude' | 'longitude'>,
        signal?: AbortSignal
    ) {
        return this.api.sendLocation(
            orThrow(this.chat, 'sendLocation').id,
            latitude,
            longitude,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `editMessageLiveLocation`. Use this method to edit live location messages. A location can be edited until its live_period expires or editing is explicitly disabled by a call to stopMessageLiveLocation. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned.
     *
     * @param latitude Latitude of new location
     * @param longitude Longitude of new location
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagelivelocation
     */
    editMessageLiveLocation(
        latitude: number,
        longitude: number,
        other?: Other<
            'editMessageLiveLocation',
            'message_id' | 'inline_message_id' | 'latitude' | 'longitude'
        >,
        signal?: AbortSignal
    ) {
        const inlineId = (this.callbackQuery ?? this.chosenInlineResult)
            ?.inline_message_id
        return inlineId !== undefined
            ? this.api.editMessageLiveLocationInline(
                  inlineId,
                  latitude,
                  longitude,
                  other
              )
            : this.api.editMessageLiveLocation(
                  orThrow(this.chat, 'editMessageLiveLocation').id,
                  orThrow(this.msg, 'editMessageLiveLocation').message_id,
                  latitude,
                  longitude,
                  other,
                  signal
              )
    }

    /**
     * Context-aware alias for `stopMessageLiveLocation`. Use this method to stop updating a live location message before live_period expires. On success, if the message was sent by the bot, the sent Message is returned, otherwise True is returned.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#stopmessagelivelocation
     */
    stopMessageLiveLocation(
        other?: Other<
            'stopMessageLiveLocation',
            'message_id' | 'inline_message_id'
        >,
        signal?: AbortSignal
    ) {
        const inlineId = (this.callbackQuery ?? this.chosenInlineResult)
            ?.inline_message_id
        return inlineId !== undefined
            ? this.api.stopMessageLiveLocationInline(inlineId, other)
            : this.api.stopMessageLiveLocation(
                  orThrow(this.chat, 'stopMessageLiveLocation').id,
                  orThrow(this.msg, 'stopMessageLiveLocation').message_id,
                  other,
                  signal
              )
    }

    /**
     * Context-aware alias for `sendVenue`. Use this method to send information about a venue. On success, the sent Message is returned.
     *
     * @param latitude Latitude of the venue
     * @param longitude Longitude of the venue
     * @param title Name of the venue
     * @param address Address of the venue
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendvenue
     */
    replyWithVenue(
        latitude: number,
        longitude: number,
        title: string,
        address: string,
        other?: Other<
            'sendVenue',
            'latitude' | 'longitude' | 'title' | 'address'
        >,
        signal?: AbortSignal
    ) {
        return this.api.sendVenue(
            orThrow(this.chat, 'sendVenue').id,
            latitude,
            longitude,
            title,
            address,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `sendContact`. Use this method to send phone contacts. On success, the sent Message is returned.
     *
     * @param phone_number Contact's phone number
     * @param first_name Contact's first name
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendcontact
     */
    replyWithContact(
        phone_number: string,
        first_name: string,
        other?: Other<'sendContact', 'phone_number' | 'first_name'>,
        signal?: AbortSignal
    ) {
        return this.api.sendContact(
            orThrow(this.chat, 'sendContact').id,
            phone_number,
            first_name,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `sendPoll`. Use this method to send a native poll. On success, the sent Message is returned.
     *
     * @param question Poll question, 1-300 characters
     * @param options A list of answer options, 2-10 strings 1-100 characters each
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendpoll
     */
    replyWithPoll(
        question: string,
        options: readonly string[],
        other?: Other<'sendPoll', 'question' | 'options'>,
        signal?: AbortSignal
    ) {
        return this.api.sendPoll(
            orThrow(this.chat, 'sendPoll').id,
            question,
            options,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `sendDice`. Use this method to send an animated emoji that will display a random value. On success, the sent Message is returned.
     *
     * @param emoji Emoji on which the dice throw animation is based. Currently, must be one of “🎲”, “🎯”, “🏀”, “⚽”, or “🎰”. Dice can have values 1-6 for “🎲” and “🎯”, values 1-5 for “🏀” and “⚽”, and values 1-64 for “🎰”. Defaults to “🎲”
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#senddice
     */
    replyWithDice(
        emoji: string,
        other?: Other<'sendDice', 'emoji'>,
        signal?: AbortSignal
    ) {
        return this.api.sendDice(
            orThrow(this.chat, 'sendDice').id,
            emoji,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `sendChatAction`. Use this method when you need to tell the user that something is happening on the bot's side. The status is set for 5 seconds or less (when a message arrives from your bot, Telegram clients clear its typing status). Returns True on success.
     *
     * Example: The ImageBot needs some time to process a request and upload the image. Instead of sending a text message along the lines of “Retrieving image, please wait…”, the bot may use sendChatAction with action = upload_photo. The user will see a “sending photo” status for the bot.
     *
     * We only recommend using this method when a response from the bot will take a noticeable amount of time to arrive.
     *
     * @param action Type of action to broadcast. Choose one, depending on what the user is about to receive: typing for text messages, upload_photo for photos, record_video or upload_video for videos, record_voice or upload_voice for voice notes, upload_document for general files, find_location for location data, record_video_note or upload_video_note for video notes.
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendchataction
     */
    replyWithChatAction(
        action:
            | 'typing'
            | 'upload_photo'
            | 'record_video'
            | 'upload_video'
            | 'record_voice'
            | 'upload_voice'
            | 'upload_document'
            | 'find_location'
            | 'record_video_note'
            | 'upload_video_note',
        signal?: AbortSignal
    ) {
        return this.api.sendChatAction(
            orThrow(this.chat, 'sendChatAction').id,
            action,
            signal
        )
    }

    /**
     * Context-aware alias for `getUserProfilePhotos`. Use this method to get a list of profile pictures for a user. Returns a UserProfilePhotos object.
     *
     * @param user_id Unique identifier of the target user
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getuserprofilephotos
     */
    getUserProfilePhotos(
        other?: Other<'getUserProfilePhotos', 'user_id'>,
        signal?: AbortSignal
    ) {
        return this.api.getUserProfilePhotos(
            orThrow(this.from, 'getUserProfilePhotos').id,
            other,
            signal
        )
    }

    // TODO: alias for getFile?

    /** @deprecated Use `banAuthor` instead. */
    kickAuthor(...args: Parameters<Context['banAuthor']>) {
        return this.banAuthor(...args)
    }

    /**
     * Context-aware alias for `banChatMember`. Use this method to ban a user in a group, a supergroup or a channel. In the case of supergroups and channels, the user will not be able to return to the chat on their own using invite links, etc., unless unbanned first. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights. Returns True on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#banchatmember
     */
    banAuthor(other?: Other<'banChatMember', 'user_id'>, signal?: AbortSignal) {
        return this.api.banChatMember(
            orThrow(this.chat, 'banChatMember').id,
            orThrow(this.from, 'banChatMember').id,
            other,
            signal
        )
    }

    /** @deprecated Use `banChatMember` instead. */
    kickChatMember(...args: Parameters<Context['banChatMember']>) {
        return this.banChatMember(...args)
    }

    /**
     * Context-aware alias for `banChatMember`. Use this method to ban a user in a group, a supergroup or a channel. In the case of supergroups and channels, the user will not be able to return to the chat on their own using invite links, etc., unless unbanned first. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights. Returns True on success.
     *
     * @param user_id Unique identifier of the target user
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#banchatmember
     */
    banChatMember(
        user_id: number,
        other?: Other<'banChatMember', 'user_id'>,
        signal?: AbortSignal
    ) {
        return this.api.banChatMember(
            orThrow(this.chat, 'banChatMember').id,
            user_id,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `unbanChatMember`. Use this method to unban a previously banned user in a supergroup or channel. The user will not return to the group or channel automatically, but will be able to join via link, etc. The bot must be an administrator for this to work. By default, this method guarantees that after the call the user is not a member of the chat, but will be able to join it. So if the user is a member of the chat they will also be removed from the chat. If you don't want this, use the parameter only_if_banned. Returns True on success.
     *
     * @param user_id Unique identifier of the target user
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unbanchatmember
     */
    unbanChatMember(
        user_id: number,
        other?: Other<'unbanChatMember', 'user_id'>,
        signal?: AbortSignal
    ) {
        return this.api.unbanChatMember(
            orThrow(this.chat, 'unbanChatMember').id,
            user_id,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `restrictChatMember`. Use this method to restrict a user in a supergroup. The bot must be an administrator in the supergroup for this to work and must have the appropriate admin rights. Pass True for all permissions to lift restrictions from a user. Returns True on success.
     *
     * @param permissions An object for new user permissions
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#restrictchatmember
     */
    restrictAuthor(
        permissions: ChatPermissions,
        other?: Other<'restrictChatMember', 'user_id' | 'permissions'>,
        signal?: AbortSignal
    ) {
        return this.api.restrictChatMember(
            orThrow(this.chat, 'restrictChatMember').id,
            orThrow(this.from, 'restrictChatMember').id,
            permissions,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `restrictChatMember`. Use this method to restrict a user in a supergroup. The bot must be an administrator in the supergroup for this to work and must have the appropriate admin rights. Pass True for all permissions to lift restrictions from a user. Returns True on success.
     *
     * @param user_id Unique identifier of the target user
     * @param permissions An object for new user permissions
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#restrictchatmember
     */
    restrictChatMember(
        user_id: number,
        permissions: ChatPermissions,
        other?: Other<'restrictChatMember', 'user_id' | 'permissions'>,
        signal?: AbortSignal
    ) {
        return this.api.restrictChatMember(
            orThrow(this.chat, 'restrictChatMember').id,
            user_id,
            permissions,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `promoteChatMember`. Use this method to promote or demote a user in a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights. Pass False for all boolean parameters to demote a user. Returns True on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#promotechatmember
     */
    promoteAuthor(
        other?: Other<'promoteChatMember', 'user_id'>,
        signal?: AbortSignal
    ) {
        return this.api.promoteChatMember(
            orThrow(this.chat, 'promoteChatMember').id,
            orThrow(this.from, 'promoteChatMember').id,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `promoteChatMember`. Use this method to promote or demote a user in a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights. Pass False for all boolean parameters to demote a user. Returns True on success.
     *
     * @param user_id Unique identifier of the target user (if unspecified, defaults to author of update)
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#promotechatmember
     */
    promoteChatMember(
        user_id: number,
        other?: Other<'promoteChatMember', 'user_id'>,
        signal?: AbortSignal
    ) {
        return this.api.promoteChatMember(
            orThrow(this.chat, 'promoteChatMember').id,
            user_id,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `setChatAdministratorCustomTitle`. Use this method to set a custom title for an administrator in a supergroup promoted by the bot. Returns True on success.
     *
     * @param custom_title New custom title for the administrator; 0-16 characters, emoji are not allowed
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatadministratorcustomtitle
     */
    setChatAdministratorAuthorCustomTitle(
        custom_title: string,
        signal?: AbortSignal
    ) {
        return this.api.setChatAdministratorCustomTitle(
            orThrow(this.chat, 'setChatAdministratorCustomTitle').id,
            orThrow(this.from, 'setChatAdministratorCustomTitle').id,
            custom_title,
            signal
        )
    }

    /**
     * Context-aware alias for `setChatAdministratorCustomTitle`. Use this method to set a custom title for an administrator in a supergroup promoted by the bot. Returns True on success.
     *
     * @param user_id Unique identifier of the target user
     * @param custom_title New custom title for the administrator; 0-16 characters, emoji are not allowed
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatadministratorcustomtitle
     */
    setChatAdministratorCustomTitle(
        user_id: number,
        custom_title: string,
        signal?: AbortSignal
    ) {
        return this.api.setChatAdministratorCustomTitle(
            orThrow(this.chat, 'setChatAdministratorCustomTitle').id,
            user_id,
            custom_title,
            signal
        )
    }

    /**
     * Context-aware alias for `setChatPermissions`. Use this method to set default chat permissions for all members. The bot must be an administrator in the group or a supergroup for this to work and must have the can_restrict_members admin rights. Returns True on success.
     *
     * @param permissions New default chat permissions
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatpermissions
     */
    setChatPermissions(permissions: ChatPermissions, signal?: AbortSignal) {
        return this.api.setChatPermissions(
            orThrow(this.chat, 'setChatPermissions').id,
            permissions,
            signal
        )
    }

    /**
     * Context-aware alias for `exportChatInviteLink`. Use this method to generate a new primary invite link for a chat; any previously generated primary link is revoked. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights. Returns the new invite link as String on success.
     *
     * Note: Each administrator in a chat generates their own invite links. Bots can't use invite links generated by other administrators. If you want your bot to work with invite links, it will need to generate its own link using exportChatInviteLink or by calling the getChat method. If your bot needs to generate a new primary invite link replacing its previous one, use exportChatInviteLink again.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#exportchatinvitelink
     */
    exportChatInviteLink(signal?: AbortSignal) {
        return this.api.exportChatInviteLink(
            orThrow(this.chat, 'exportChatInviteLink').id,
            signal
        )
    }

    /**
     * Context-aware alias for `createChatInviteLink`. Use this method to create an additional invite link for a chat. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights. The link can be revoked using the method revokeChatInviteLink. Returns the new invite link as ChatInviteLink object.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#createchatinvitelink
     */
    createChatInviteLink(
        other?: Other<'createChatInviteLink'>,
        signal?: AbortSignal
    ) {
        return this.api.createChatInviteLink(
            orThrow(this.chat, 'createChatInviteLink').id,
            other,
            signal
        )
    }

    /**
     *  Context-aware alias for `editChatInviteLink`. Use this method to edit a non-primary invite link created by the bot. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights. Returns the edited invite link as a ChatInviteLink object.
     *
     * @param invite_link The invite link to edit
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editchatinvitelink
     */
    editChatInviteLink(
        invite_link: string,
        other?: Other<'editChatInviteLink', 'invite_link'>,
        signal?: AbortSignal
    ) {
        return this.api.editChatInviteLink(
            orThrow(this.chat, 'editChatInviteLink').id,
            invite_link,
            other,
            signal
        )
    }

    /**
     *  Context-aware alias for `revokeChatInviteLink`. Use this method to revoke an invite link created by the bot. If the primary link is revoked, a new link is automatically generated. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights. Returns the revoked invite link as ChatInviteLink object.
     *
     * @param invite_link The invite link to revoke
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#revokechatinvitelink
     */
    revokeChatInviteLink(invite_link: string, signal?: AbortSignal) {
        return this.api.revokeChatInviteLink(
            orThrow(this.chat, 'editChatInviteLink').id,
            invite_link,
            signal
        )
    }

    /**
     * Context-aware alias for `setChatPhoto`. Use this method to set a new profile photo for the chat. Photos can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights. Returns True on success.
     *
     * @param photo New chat photo, uploaded using multipart/form-data
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatphoto
     */
    setChatPhoto(photo: InputFile, signal?: AbortSignal) {
        return this.api.setChatPhoto(
            orThrow(this.chat, 'setChatPhoto').id,
            photo,
            signal
        )
    }

    /**
     * Context-aware alias for `deleteChatPhoto`. Use this method to delete a chat photo. Photos can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights. Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deletechatphoto
     */
    deleteChatPhoto(signal?: AbortSignal) {
        return this.api.deleteChatPhoto(
            orThrow(this.chat, 'deleteChatPhoto').id,
            signal
        )
    }

    /**
     * Context-aware alias for `setChatTitle`. Use this method to change the title of a chat. Titles can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights. Returns True on success.
     *
     * @param title New chat title, 1-255 characters
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchattitle
     */
    setChatTitle(title: string, signal?: AbortSignal) {
        return this.api.setChatTitle(
            orThrow(this.chat, 'setChatTitle').id,
            title,
            signal
        )
    }

    /**
     * Context-aware alias for `setChatDescription`. Use this method to change the description of a group, a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights. Returns True on success.
     *
     * @param description New chat description, 0-255 characters
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatdescription
     */
    setChatDescription(description: string | undefined, signal?: AbortSignal) {
        return this.api.setChatDescription(
            orThrow(this.chat, 'setChatDescription').id,
            description,
            signal
        )
    }

    /**
     * Context-aware alias for `pinChatMessage`. Use this method to add a message to the list of pinned messages in a chat. If the chat is not a private chat, the bot must be an administrator in the chat for this to work and must have the 'can_pin_messages' admin right in a supergroup or 'can_edit_messages' admin right in a channel. Returns True on success.
     *
     * @param message_id Identifier of a message to pin
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#pinchatmessage
     */
    pinChatMessage(
        message_id: number,
        other?: Other<'pinChatMessage', 'message_id'>,
        signal?: AbortSignal
    ) {
        return this.api.pinChatMessage(
            orThrow(this.chat, 'pinChatMessage').id,
            message_id,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `unpinChatMessage`. Use this method to remove a message from the list of pinned messages in a chat. If the chat is not a private chat, the bot must be an administrator in the chat for this to work and must have the 'can_pin_messages' admin right in a supergroup or 'can_edit_messages' admin right in a channel. Returns True on success.
     *
     * @param message_id Identifier of a message to unpin. If not specified, the most recent pinned message (by sending date) will be unpinned.
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unpinchatmessage
     */
    unpinChatMessage(message_id?: number, signal?: AbortSignal) {
        return this.api.unpinChatMessage(
            orThrow(this.chat, 'unpinChatMessage').id,
            message_id,
            signal
        )
    }

    /**
     * Context-aware alias for `unpinAllChatMessages`. Use this method to clear the list of pinned messages in a chat. If the chat is not a private chat, the bot must be an administrator in the chat for this to work and must have the 'can_pin_messages' admin right in a supergroup or 'can_edit_messages' admin right in a channel. Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unpinallchatmessages
     */
    unpinAllChatMessages(signal?: AbortSignal) {
        return this.api.unpinAllChatMessages(
            orThrow(this.chat, 'unpinAllChatMessages').id,
            signal
        )
    }

    /**
     * Context-aware alias for `leaveChat`. Use this method for your bot to leave a group, supergroup or channel. Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#leavechat
     */
    leaveChat(signal?: AbortSignal) {
        return this.api.leaveChat(orThrow(this.chat, 'leaveChat').id, signal)
    }

    /**
     * Context-aware alias for `getChat`. Use this method to get up to date information about the chat (current name of the user for one-on-one conversations, current username of a user, group or channel, etc.). Returns a Chat object on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getchat
     */
    getChat(signal?: AbortSignal) {
        return this.api.getChat(orThrow(this.chat, 'getChat').id, signal)
    }

    /**
     * Context-aware alias for `getChatAdministrators`. Use this method to get a list of administrators in a chat. On success, returns an Array of ChatMember objects that contains information about all chat administrators except other bots. If the chat is a group or a supergroup and no administrators were appointed, only the creator will be returned.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getchatadministrators
     */
    getChatAdministrators(signal?: AbortSignal) {
        return this.api.getChatAdministrators(
            orThrow(this.chat, 'getChatAdministrators').id,
            signal
        )
    }

    /** @deprecated Use `getChatMembersCount` instead. */
    getChatMembersCount(...args: Parameters<Context['getChatMemberCount']>) {
        return this.getChatMemberCount(...args)
    }

    /**
     * Context-aware alias for `getChatMemberCount`. Use this method to get the number of members in a chat. Returns Int on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getchatmembercount
     */
    getChatMemberCount(signal?: AbortSignal) {
        return this.api.getChatMemberCount(
            orThrow(this.chat, 'getChatMemberCount').id,
            signal
        )
    }

    /**
     * Context-aware alias for `getChatMember`. Use this method to get information about a member of a chat. Returns a ChatMember object on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getchatmember
     */
    getAuthor(signal?: AbortSignal) {
        return this.api.getChatMember(
            orThrow(this.chat, 'getChatMember').id,
            orThrow(this.from, 'getChatMember').id,
            signal
        )
    }

    /**
     * Context-aware alias for `getChatMember`. Use this method to get information about a member of a chat. Returns a ChatMember object on success.
     *
     * @param user_id Unique identifier of the target user (if unspecified, defaults to author of update)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getchatmember
     */
    getChatMember(user_id: number, signal?: AbortSignal) {
        return this.api.getChatMember(
            orThrow(this.chat, 'getChatMember').id,
            user_id,
            signal
        )
    }

    /**
     * Context-aware alias for `setChatStickerSet`. Use this method to set a new group sticker set for a supergroup. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights. Use the field can_set_sticker_set ly returned in getChat requests to check if the bot can use this method. Returns True on success.
     *
     * @param sticker_set_name Name of the sticker set to be set as the group sticker set
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatstickerset
     */
    setChatStickerSet(sticker_set_name: string, signal?: AbortSignal) {
        return this.api.setChatStickerSet(
            orThrow(this.chat, 'setChatStickerSet').id,
            sticker_set_name,
            signal
        )
    }

    /**
     * Context-aware alias for `deleteChatStickerSet`. Use this method to delete a group sticker set from a supergroup. The bot must be an administrator in the chat for this to work and must have the appropriate admin rights. Use the field can_set_sticker_set ly returned in getChat requests to check if the bot can use this method. Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deletechatstickerset
     */
    deleteChatStickerSet(signal?: AbortSignal) {
        return this.api.deleteChatStickerSet(
            orThrow(this.chat, 'deleteChatStickerSet').id,
            signal
        )
    }

    /**
     * Context-aware alias for `answerCallbackQuery`. Use this method to send answers to callback queries sent from inline keyboards. The answer will be displayed to the user as a notification at the top of the chat screen or as an alert. On success, True is returned.
     *
     * Alternatively, the user can be redirected to the specified Game URL. For this option to work, you must first create a game for your bot via @Botfather and accept the terms. Otherwise, you may use links like t.me/your_bot?start=XXXX that open your bot with a parameter.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#answercallbackquery
     */
    answerCallbackQuery(
        other?: Other<'answerCallbackQuery', 'callback_query_id'>,
        signal?: AbortSignal
    ) {
        return this.api.answerCallbackQuery(
            orThrow(this.callbackQuery, 'answerCallbackQuery').id,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `editMessageText`. Use this method to edit text and game messages. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned.
     *
     * @param text New text of the message, 1-4096 characters after entities parsing
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagetext
     */
    editMessageText(
        text: string,
        other?: Other<
            'editMessageText',
            'message_id' | 'inline_message_id' | 'text'
        >,
        signal?: AbortSignal
    ) {
        const inlineId = (this.callbackQuery ?? this.chosenInlineResult)
            ?.inline_message_id
        return inlineId !== undefined
            ? this.api.editMessageTextInline(inlineId, text, other)
            : this.api.editMessageText(
                  orThrow(this.chat, 'editMessageText').id,
                  orThrow(this.msg, 'editMessageText').message_id,
                  text,
                  other,
                  signal
              )
    }

    /**
     * Context-aware alias for `editMessageCaption`. Use this method to edit captions of messages. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagecaption
     */
    editMessageCaption(
        other?: Other<'editMessageCaption', 'message_id' | 'inline_message_id'>,
        signal?: AbortSignal
    ) {
        const inlineId = (this.callbackQuery ?? this.chosenInlineResult)
            ?.inline_message_id
        return inlineId !== undefined
            ? this.api.editMessageCaptionInline(inlineId, other)
            : this.api.editMessageCaption(
                  orThrow(this.chat, 'editMessageCaption').id,
                  orThrow(this.msg, 'editMessageCaption').message_id,
                  other,
                  signal
              )
    }

    /**
     * Context-aware alias for `editMessageMedia`. Use this method to edit animation, audio, document, photo, or video messages. If a message is part of a message album, then it can be edited only to an audio for audio albums, only to a document for document albums and to a photo or a video otherwise. When an inline message is edited, a new file can't be uploaded. Use a previously uploaded file via its file_id or specify a URL. On success, if the edited message was sent by the bot, the edited Message is returned, otherwise True is returned.
     *
     * @param media An object for a new media content of the message
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagemedia
     */
    editMessageMedia(
        media: InputMedia,
        other?: Other<
            'editMessageMedia',
            'message_id' | 'inline_message_id' | 'media'
        >,
        signal?: AbortSignal
    ) {
        const inlineId = (this.callbackQuery ?? this.chosenInlineResult)
            ?.inline_message_id
        return inlineId !== undefined
            ? this.api.editMessageMediaInline(inlineId, media, other)
            : this.api.editMessageMedia(
                  orThrow(this.chat, 'editMessageMedia').id,
                  orThrow(this.msg, 'editMessageMedia').message_id,
                  media,
                  other,
                  signal
              )
    }

    /**
     * Context-aware alias for `editMessageReplyMarkup`. Use this method to edit only the reply markup of messages. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagereplymarkup
     */
    editMessageReplyMarkup(
        other?: Other<
            'editMessageReplyMarkup',
            'message_id' | 'inline_message_id'
        >,
        signal?: AbortSignal
    ) {
        const inlineId = (this.callbackQuery ?? this.chosenInlineResult)
            ?.inline_message_id
        return inlineId !== undefined
            ? this.api.editMessageReplyMarkupInline(inlineId, other)
            : this.api.editMessageReplyMarkup(
                  orThrow(this.chat, 'editMessageReplyMarkup').id,
                  orThrow(this.msg, 'editMessageReplyMarkup').message_id,
                  other,
                  signal
              )
    }

    /**
     * Context-aware alias for `stopPoll`. Use this method to stop a poll which was sent by the bot. On success, the stopped Poll with the final results is returned.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#stoppoll
     */
    stopPoll(other?: Other<'stopPoll', 'message_id'>, signal?: AbortSignal) {
        return this.api.stopPoll(
            orThrow(this.chat, 'stopPoll').id,
            orThrow(this.msg, 'stopPoll').message_id,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `deleteMessage`. Use this method to delete a message, including service messages, with the following limitations:
     * - A message can only be deleted if it was sent less than 48 hours ago.
     * - A dice message in a private chat can only be deleted if it was sent more than 24 hours ago.
     * - Bots can delete outgoing messages in private chats, groups, and supergroups.
     * - Bots can delete incoming messages in private chats.
     * - Bots granted can_post_messages permissions can delete outgoing messages in channels.
     * - If the bot is an administrator of a group, it can delete any message there.
     * - If the bot has can_delete_messages permission in a supergroup or a channel, it can delete any message there.
     * Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deletemessage
     */
    deleteMessage(signal?: AbortSignal) {
        return this.api.deleteMessage(
            orThrow(this.chat, 'deleteMessage').id,
            orThrow(this.msg, 'deleteMessage').message_id,
            signal
        )
    }

    /**
     * Context-aware alias for `sendSticker`. Use this method to send static .WEBP or animated .TGS stickers. On success, the sent Message is returned.
     *
     * @param sticker Sticker to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a .WEBP file from the Internet, or upload a new one using multipart/form-data.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendsticker
     */
    replyWithSticker(
        sticker: InputFile | string,
        other?: Other<'sendSticker', 'sticker'>,
        signal?: AbortSignal
    ) {
        return this.api.sendSticker(
            orThrow(this.chat, 'sendSticker').id,
            sticker,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `answerInlineQuery`. Use this method to send answers to an inline query. On success, True is returned.
     * No more than 50 results per query are allowed.
     *
     * Example: An inline bot that sends YouTube videos can ask the user to connect the bot to their YouTube account to adapt search results accordingly. To do this, it displays a 'Connect your YouTube account' button above the results, or even before showing any. The user presses the button, switches to a private chat with the bot and, in doing so, passes a start parameter that instructs the bot to return an oauth link. Once done, the bot can offer a switch_inline button so that the user can easily return to the chat where they wanted to use the bot's inline capabilities.
     *
     * @param results An array of results for the inline query
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#answerinlinequery
     */
    answerInlineQuery(
        results: readonly InlineQueryResult[],
        other?: Other<'answerInlineQuery', 'inline_query_id' | 'results'>,
        signal?: AbortSignal
    ) {
        return this.api.answerInlineQuery(
            orThrow(this.inlineQuery, 'answerInlineQuery').id,
            results,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `sendInvoice`. Use this method to send invoices. On success, the sent Message is returned.
     *
     * @param title Product name, 1-32 characters
     * @param description Product description, 1-255 characters
     * @param payload Bot-defined invoice payload, 1-128 bytes. This will not be displayed to the user, use for your internal processes.
     * @param provider_token Payments provider token, obtained via Botfather
     * @param currency Three-letter ISO 4217 currency code, see more on currencies
     * @param prices Price breakdown, a list of components (e.g. product price, tax, discount, delivery cost, delivery tax, bonus, etc.)
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendinvoice
     */
    replyWithInvoice(
        title: string,
        description: string,
        payload: string,
        provider_token: string,
        currency: string,
        prices: readonly LabeledPrice[],
        other?: Other<
            'sendInvoice',
            | 'title'
            | 'description'
            | 'payload'
            | 'provider_token'
            | 'start_parameter'
            | 'currency'
            | 'prices'
        >,
        signal?: AbortSignal
    ) {
        return this.api.sendInvoice(
            orThrow(this.chat, 'sendInvoice').id,
            title,
            description,
            payload,
            provider_token,
            currency,
            prices,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `answerShippingQuery`. If you sent an invoice requesting a shipping address and the parameter is_flexible was specified, the Bot API will send an Update with a shipping_query field to the bot. Use this method to reply to shipping queries. On success, True is returned.
     *
     * @param shipping_query_id Unique identifier for the query to be answered
     * @param ok Specify True if delivery to the specified address is possible and False if there are any problems (for example, if delivery to the specified address is not possible)
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#answershippingquery
     */
    answerShippingQuery(
        ok: boolean,
        other?: Other<'answerShippingQuery', 'shipping_query_id' | 'ok'>,
        signal?: AbortSignal
    ) {
        return this.api.answerShippingQuery(
            orThrow(this.shippingQuery, 'answerShippingQuery').id,
            ok,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `answerPreCheckoutQuery`. Once the user has confirmed their payment and shipping details, the Bot API sends the final confirmation in the form of an Update with the field pre_checkout_query. Use this method to respond to such pre-checkout queries. On success, True is returned. Note: The Bot API must receive an answer within 10 seconds after the pre-checkout query was sent.
     *
     * @param ok Specify True if everything is alright (goods are available, etc.) and the bot is ready to proceed with the order. Use False if there are any problems.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#answerprecheckoutquery
     */
    answerPreCheckoutQuery(
        ok: boolean,
        other?: Other<'answerPreCheckoutQuery', 'pre_checkout_query_id' | 'ok'>,
        signal?: AbortSignal
    ) {
        return this.api.answerPreCheckoutQuery(
            orThrow(this.preCheckoutQuery, 'answerPreCheckoutQuery').id,
            ok,
            other,
            signal
        )
    }

    /**
     * Context-aware alias for `setPassportDataErrors`. Informs a user that some of the Telegram Passport elements they provided contains errors. The user will not be able to re-submit their Passport to you until the errors are fixed (the contents of the field for which you returned the error must change). Returns True on success.
     *
     * Use this if the data submitted by the user doesn't satisfy the standards your service requires for any reason. For example, if a birthday date seems invalid, a submitted document is blurry, a scan shows evidence of tampering, etc. Supply some details in the error message to make sure the user knows how to correct the issues.
     *
     * @param errors An array describing the errors
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setpassportdataerrors
     */
    setPassportDataErrors(
        errors: readonly PassportElementError[],
        signal?: AbortSignal
    ) {
        return this.api.setPassportDataErrors(
            orThrow(this.from, 'setPassportDataErrors').id,
            errors,
            signal
        )
    }

    /**
     * Context-aware alias for `sendGame`. Use this method to send a game. On success, the sent Message is returned.
     *
     * @param game_short_name Short name of the game, serves as the unique identifier for the game. Set up your games via Botfather.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendgame
     */
    replyWithGame(
        game_short_name: string,
        other?: Other<'sendGame', 'game_short_name'>,
        signal?: AbortSignal
    ) {
        return this.api.sendGame(
            orThrow(this.chat, 'sendGame').id,
            game_short_name,
            other,
            signal
        )
    }
}

function orThrow<T>(value: T | undefined, method: string): T {
    if (value === undefined)
        throw new Error(`Missing information for API call to ${method}`)
    return value
}
