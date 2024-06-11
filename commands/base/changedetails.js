const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('change')
        .setDescription('Change the details of a cursed user.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to change the details of.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the user.')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('avatar')
                .setDescription('The avatar of the user.')
                .setRequired(false)),
    async execute(interaction, users, coll) {
        // get mentioned user
        const cursedUser = interaction.options.getUser('target');
        const user = await coll.findOne({id: cursedUser.id});
        console.log('cursedUser', cursedUser, user)

        if (!user || !user.cursed) {
            return interaction.reply({ content: 'This user is not cursed.', ephemeral: true });
        } 
        if (user.cursedBy !== interaction.user.id) {
            return interaction.reply({ content: 'You cannot change the details of a user you did not curse.', ephemeral: true });
        }
        const cursedUserObj = user;
        if (interaction.options.getString('name')) {
            cursedUserObj.name = interaction.options.getString('name');
        }
        if (interaction.options.getString('avatar')) {
            cursedUserObj.avatar = interaction.options.getString('avatar');
        }
        coll.updateOne({id: cursedUser.id}, {$set: cursedUserObj}, {upsert: true});
        return interaction.reply({ content: `You have changed the details of <@!${cursedUser.id}>.`, ephemeral: true });
    }
};