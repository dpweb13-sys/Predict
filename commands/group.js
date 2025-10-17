module.exports = {
    run: async (ctx) => {
        if(!ctx.chat.type.includes('group')) return ctx.reply('This command is only for groups!');
        const userId = ctx.from.id;
        const member = await ctx.getChatMember(userId);
        if(!member.status.includes('administrator')) return ctx.reply('You must be an admin to use this.');
        ctx.reply('Group command executed! (promote/demote/etc.)');
    }
}
