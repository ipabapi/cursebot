const { SlashCommandBuilder} = require('discord.js');
const fs = require('node:fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('curse')
        .setDescription('Curse a user.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to curse.')
                .setRequired(true)),
    async execute(interaction, users, coll) {
        // get mentioned user
        const cursedUser = interaction.options.getUser('target');
        const user = await coll.findOne({id: cursedUser.id});
        console.log('cursedUser', cursedUser)
        if (user) {
        if (user.cursed ) {
            return interaction.reply({ content: 'This user is already cursed.', ephemeral: true });
        } 
        }
        const cursedUserObj = {
            cursed: true,
            cursedBy: interaction.user.id,
            cursedAt: Date.now(),
            avatar: cursedUser.displayAvatarURL({ format: 'png', dynamic: true }),
            name: cursedUser.username,
        }
        console.log('setting cursed user object')
        await coll.updateOne({id: cursedUser.id}, {$set: cursedUserObj}, {upsert: true});

        return interaction.reply({ content: `You have cursed <@!${cursedUser.id}>.`, ephemeral: true });
    }
};