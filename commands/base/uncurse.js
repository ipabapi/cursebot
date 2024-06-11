const {SlashCommandBuilder} = require('discord.js');
const fs = require('node:fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uncurse')
        .setDescription('Uncurse a user.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to uncurse.')
                .setRequired(true)),
    async execute(interaction, users, coll) {
        // get mentioned user
        const cursedUser = interaction.options.getUser('target');
        const user = await coll.findOne({id: cursedUser.id});

        if (!user || !user.cursed) {
            return interaction.reply({ content: 'This user is not cursed.', ephemeral: true });
        } 
        if (user.cursedBy !== interaction.user.id) {
            return interaction.reply({ content: 'You cannot uncurse someone you did not curse.', ephemeral: true });
        }
        coll.updateOne({id: cursedUser.id}, {$set: {cursed: false}}, {upsert: true});
        return interaction.reply({ content: `You have uncursed <@!${cursedUser.id}>.`, ephemeral: true });
    }
};