/**
 * Cloudflare Worker – Discord Bot for AI Casinos Review
 *
 * HOW IT WORKS:
 *   Discord sends an HTTP POST to this Worker URL on every slash command.
 *   The Worker verifies the request signature, handles the command,
 *   then calls the GitHub Actions API to trigger the review workflow.
 *
 * ENVIRONMENT VARIABLES (set in Cloudflare Dashboard → Worker → Settings → Variables):
 *   DISCORD_PUBLIC_KEY  – from Discord Developer Portal
 *   GITHUB_TOKEN        – GitHub Personal Access Token (repo + workflow scope)
 *   GITHUB_REPO         – "your-username/ai-casinos-discord"
 *   DISCORD_BOT_TOKEN   – from Discord Developer Portal (for sending follow-ups)
 */

// ── Utility: hex string → Uint8Array ──────────────────────────────────────
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

// ── Verify Discord Ed25519 signature ──────────────────────────────────────
async function verifyDiscordSignature(publicKeyHex, signature, timestamp, body) {
  const key = await crypto.subtle.importKey(
    'raw',
    hexToBytes(publicKeyHex),
    { name: 'Ed25519', namedCurve: 'Ed25519' },
    false,
    ['verify']
  );

  const encoder = new TextEncoder();
  const message = encoder.encode(timestamp + body);

  return crypto.subtle.verify(
    { name: 'Ed25519' },
    key,
    hexToBytes(signature),
    message
  );
}

// ── Trigger GitHub Actions workflow ───────────────────────────────────────
async function triggerGitHub(env, workflowFile, inputs = {}) {
  const [owner, repo] = env.GITHUB_REPO.split('/');
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'AI-Casinos-Discord-Bot/1.0'
    },
    body: JSON.stringify({
      ref: 'main',
      inputs
    })
  });

  return res.ok;
}

// ── JSON response helper ───────────────────────────────────────────────────
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// ── Main fetch handler ─────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    // Only accept POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const signature = request.headers.get('X-Signature-Ed25519');
    const timestamp = request.headers.get('X-Signature-Timestamp');

    if (!signature || !timestamp) {
      return new Response('Missing headers', { status: 401 });
    }

    const body = await request.text();

    // ── Verify signature ────────────────────────────────────────────────
    let isValid = false;
    try {
      isValid = await verifyDiscordSignature(env.DISCORD_PUBLIC_KEY, signature, timestamp, body);
    } catch (e) {
      return new Response('Signature verification failed', { status: 401 });
    }

    if (!isValid) {
      return new Response('Invalid signature', { status: 401 });
    }

    const interaction = JSON.parse(body);

    // ── PING (required by Discord on first setup) ───────────────────────
    if (interaction.type === 1) {
      return jsonResponse({ type: 1 });
    }

    // ── Slash commands ──────────────────────────────────────────────────
    if (interaction.type === 2) {
      const command = interaction.data.name;
      const options = interaction.data.options || [];
      const getOpt  = name => options.find(o => o.name === name)?.value;

      // ── /review <casino_name> ────────────────────────────────────────
      if (command === 'review') {
        const casinoName = getOpt('casino');
        const ok = await triggerGitHub(env, 'manual-review.yml', {
          casino_name: casinoName || ''
        });

        return jsonResponse({
          type: 4,
          data: {
            content: ok
              ? `🎰 **Review generation started!**\n` +
                `Casino: **${casinoName || 'next in queue'}**\n` +
                `⏳ Will be live on your site in ~2 minutes.\n` +
                `📋 Check progress: https://github.com/${env.GITHUB_REPO}/actions`
              : `❌ Failed to trigger GitHub Actions. Check your GITHUB_TOKEN.`
          }
        });
      }

      // ── /schedule <casino_name> <date YYYY-MM-DD> ────────────────────
      if (command === 'schedule') {
        const casinoName = getOpt('casino');
        const date       = getOpt('date');
        const ok = await triggerGitHub(env, 'manual-review.yml', {
          casino_name:    casinoName || '',
          scheduled_date: date || ''
        });

        return jsonResponse({
          type: 4,
          data: {
            content: ok
              ? `📅 **Scheduled!**\nCasino: **${casinoName}** → Date: **${date}**\n` +
                `The review will be published automatically on that date.`
              : `❌ Failed to schedule. Check your GITHUB_TOKEN.`
          }
        });
      }

      // ── /list ────────────────────────────────────────────────────────
      if (command === 'list') {
        return jsonResponse({
          type: 4,
          data: {
            content:
              `📋 **Pending Reviews**\n` +
              `Check your \`data/casinos.json\` for the full list.\n` +
              `Published list: https://github.com/${env.GITHUB_REPO}/blob/main/data/published.json`
          }
        });
      }

      // ── /status ──────────────────────────────────────────────────────
      if (command === 'status') {
        return jsonResponse({
          type: 4,
          data: {
            content:
              `✅ **AI Casinos Bot – Online**\n` +
              `📅 Next auto-publish: daily at **09:00 UTC**\n` +
              `🌐 Live site: https://zlatev.elegance.bg/ai-casinos-discord/\n` +
              `⚙️ Actions: https://github.com/${env.GITHUB_REPO}/actions`
          }
        });
      }

      // ── /help ────────────────────────────────────────────────────────
      if (command === 'help') {
        return jsonResponse({
          type: 4,
          data: {
            content:
              `🎰 **AI Casinos Review Bot – Commands**\n\n` +
              `\`/review [casino]\` – Generate a review now (omit casino for next in queue)\n` +
              `\`/schedule <casino> <YYYY-MM-DD>\` – Schedule a review for a date\n` +
              `\`/list\` – Show published & pending reviews\n` +
              `\`/status\` – Bot & site status\n` +
              `\`/help\` – This message`
          }
        });
      }

      return jsonResponse({
        type: 4,
        data: { content: `Unknown command: \`${command}\`. Try \`/help\`.` }
      });
    }

    return new Response('Unknown interaction type', { status: 400 });
  }
};
