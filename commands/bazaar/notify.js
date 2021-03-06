/**
 *  This file is part of Bazcal.
 *
 *  Bazcal is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  Bazcal is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with Bazcal.  If not, see <https://www.gnu.org/licenses/>.
 */

const {
    Command
} = require('discord.js-commando');

module.exports = class notifyCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'notify',
            group: 'bazaar',
            memberName: 'notify',
            description: 'Gives personalized advice with notifications for orders',
            aliases: ['notif', 'n'],
            args: [{
                key: 'balance',
                prompt: 'What is you in-game **balance**? (_amount of skyblock coins_)',
                type: 'string'
            }]
        });
    }

    async run(message, {
        balance
    }) {
        const {
            member,
            channel
        } = await message.client.provider.get_channel(message);

        const parsed_balance = /\d[A-z]/.test(balance) ? message.client.provider.convert_number(balance) : parseFloat(balance);

        const advice = message.client.provider.advice(parsed_balance);

        let response = 'To see the instuctions on how to use this command do `!bz help notify`\n\n';
        response += message.client.provider.format_advice(advice);
        response += '\n\nYou have 60 seconds to respond\n\n'
        response += 'React with the order numbers then confirm with :thumbsup:...';

        message.say('Process started in your personal channel :-)');
        const main = await channel.send(`<@${message.author.id}>\n` + response);

        const choices = await message.client.provider.react_options(main, message.author.id, advice.length);
        if (!choices) return channel.send('Order creation failed try using `!bz support` for more info');

        const orders = choices.map((reaction) => advice[reaction].name)
        if (!orders || orders.length === 0) {
            await main.delete();
            return channel.send('No orders was recorded.\n\nIf you believe this to be a problem try using `!bz support`');
        }

        if (member.orders.length > 0) {
            const option_message = await channel.send('You already have other investments pending, react with :thumbsup: to remove the old investments or with :thumbsdown: to add these to the exiting investments...');
            const react = await message.client.provider.react_binary(option_message, message.author.id);

            if (react == undefined) return channel.send('Option timed out, investment was added to existing ones...')
            if (react) {
                for (let order of orders) {
                    if (!member.orders.includes(order)) {
                        member.orders.push(order)
                    }
                }
            } else {
                member.orders = orders
            }
        } else {
            member.orders = orders;
        }

        await member.save()
        return channel.send('Great! I\'ll notify you when you need to sell your investments.');
    }
}