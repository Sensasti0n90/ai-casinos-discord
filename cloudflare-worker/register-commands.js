/**
 * register-commands.js
 * Run this ONCE locally with Node.js to register Discord slash commands.
 *
 * Usage:
 *   DISCORD_BOT_TOKEN=xxx DISCORD_APP_ID=xxx node register-commands.js
 */

const TOKEN  = process.env.DISCORD_BOT_TOKEN;
const APP_ID = process.env.DISCORD_APP_ID;

const commands = [
  {
    name: 'review',
    description: 'Generate and publish a casino review',
    options: [{
      name: 'casino',
      description: 'Casino name (leave empty for next in queue)',
      type: 3, // STRING
      required: false
    }]
  },
  {
    name: 'schedule',
    description: 'Schedule a casino review for a specific date',
    options: [
      { name: 'casino', description: 'Casino name', type: 3, required: true },
      { name: 'date',   description: 'Date (YYYY-MM-DD)', type: 3, required: true }
    ]
  },
  {
    name: 'list',
    description: 'Show published and pending casino reviews'
  },
  {
    name: 'status',
    description: 'Show bot and site status'
  },
  {
    name: 'help',
    description: 'Show all available commands'
  }
];

async function register() {
  const url = `https://discord.com/api/v10/applications/${APP_ID}/commands`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bot ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commands)
  });

  const data = await res.json();

  if (res.ok) {
    console.log(`✅ Registered ${data.length} command(s):`);
    data.forEach(c => console.log(`  /${c.name}`));
  } else {
    console.error('❌ Failed:', data);
    process.exit(1);
  }
}

register();
