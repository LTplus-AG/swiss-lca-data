import axios from 'axios';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

interface SlackMessage {
  text: string;
  blocks?: any[];
}

export async function sendSlackNotification(message: SlackMessage): Promise<boolean> {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('SLACK_WEBHOOK_URL not configured, skipping notification');
    return false;
  }

  try {
    await axios.post(SLACK_WEBHOOK_URL, message);
    return true;
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
    return false;
  }
}

export function formatKBOBUpdateMessage(version: string, date: string, materialsCount: number): SlackMessage {
  return {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🆕 New KBOB Version Available!",
          emoji: true
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Version:*\n${version}`
          },
          {
            type: "mrkdwn",
            text: `*Date:*\n${date}`
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Successfully processed *${materialsCount}* materials from the new KBOB dataset.`
        }
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "🏗️ Swiss LCA Data - KBOB Auto-Updater"
          }
        ]
      }
    ]
  };
}
