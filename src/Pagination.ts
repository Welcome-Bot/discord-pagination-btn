import { Client, MessageEmbed, MessageActionRow, MessageButton, TextChannel, DMChannel, Snowflake } from "discord.js";
import { PaginationOptions } from "./types";

/** Pagination class */
class Pagination {
    /**
     * The discord.js Client
     * @type {Client}
     */
    public readonly client: Client;

    /**
     * Pagination Options
     * @type {PaginationOptions}
     * @private
     */
    private options: PaginationOptions = {
        nextBtn: {
            label: "Next",
            style: "PRIMARY",
        },
        backBtn: {
            label: "Back",
            style: "SECONDARY",
        },
        timeout: 3000,
    };

    /**
     * The page number
     * @type {number}
     */
    public page: number;

    /**
     * The the action row which will contain the buttons
     * @type {MessageActionRow}
     * @private
     */
    private _actionRow: MessageActionRow;

    /**
     * The same _actionRow but with all buttons disabled
     */
    private _actionRowEnd: MessageActionRow;

    /**
     * Pages
     * @type {Array<MessageEmbed>}
     */
    public pages: Array<MessageEmbed>;

    /**
     * Text channel to send embed
     * @type {TextChannel | DMChannel}
     */
    public channel: TextChannel | DMChannel;

    /**
     * Authorized Users
     * @type {Array<Snowflake>}
     */
    public authorizedUsers: Array<Snowflake>;

    constructor(client: Client, options: PaginationOptions) {
        this.client = client;
        this.options = Object.assign(this.options, options);
        this.page = 0;
        this._actionRow = new MessageActionRow();
        const nextButton = new MessageButton()
            .setLabel(this.options.nextBtn.label)
            .setStyle(this.options.nextBtn.style)
            .setCustomId("nextBtn");
        const backButton = new MessageButton()
            .setLabel(this.options.backBtn.label)
            .setStyle(this.options.backBtn.style)
            .setCustomId("backBtn");
        this._actionRow.addComponents(
            nextButton,
            backButton,
        );
        this._actionRowEnd.addComponents(
            nextButton.setDisabled(true),
            backButton.setDisabled(true),
        );
        this.client.on("interactionCreate", (interaction: any) => {
            if (!interaction.isButton()) return;
            const ids = ["nextBtn", "backBtn"];
            const filter = (i: any) => ids.indexOf(i.customId) > 0 && this.authorizedUsers.indexOf(i.user.id) > 0;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: this.options.timeout });
            collector.on("collect", async (i: any) => {
                switch(i.customId) {
                    case "nextBtn":
                        this.page = this.page + 1 < this.pages.length ? ++this.page : 0;
                        i.update({
                            embeds: [this.pages[this.page]],
                            components: [this._actionRow],
                        });
                        break;
                    case "backBtn":
                        this.page = this.page > 0 ? --this.page : this.pages.length - 1;
                        i.update({
                            embeds: [this.pages[this.page]],
                            components: [this._actionRow],
                        });
                        break;
                }
            });
            collector.on("end", async (i: any) => {
                i.update({
                    embeds: [this.pages[this.page]],
                    components: [this._actionRowEnd],
                });
            })
        });
    }

    /**
     * Set Array of pages to paginate
     * @param array - Those pages
     * @return {boolen}
     */
    public setPages(array: Array<MessageEmbed>) {
        this.pages = array;
        return true;
    }

    /**
     * Set the channel where the embed should be sent
     * @param channel - A TextChannel
     * @return {boolen}
     */
    public setChannel(channel: TextChannel | DMChannel) {
        if (!(channel instanceof TextChannel) && !(channel instanceof DMChannel)) throw new TypeError("Pagination.setChannel() requires channel to be an instance of TextChannel or DMChannel");
        this.channel = channel;
        return true;
    }

    /**
     * Set an array of user IDs who can switch pages
     * @param users - A array of user IDs
     * @return {boolen}
     */
    public setAuthorizedUsers(users: Array<Snowflake>) {
        this.authorizedUsers = users;
        return true;
    }

    /**
     * Send the embed
     * @return {boolen}
     */
    public send() {
        if (!this.channel) throw new Error("Channel not set");
        if (!this.pages) throw new Error("Pages not set");
        if (!this.authorizedUsers) throw new Error("Authorized Users not set");
        this.channel.send({
            embeds: [this.pages[this.page]],
            components: [this._actionRow],
        })
            .then((msg: any) => {return msg;})
            .catch(console.error);
        return true;
    }
}

export { Pagination };
