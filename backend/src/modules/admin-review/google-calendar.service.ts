import crypto from 'crypto';

interface MeetingDetails {
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  attendeeEmail: string;
}

export class GoogleCalendarService {
  /**
   * Books a Google Meet call by calling the Google Calendar API.
   * If credentials are not present in .env, falls back to generating a mock Google Meet link.
   */
  static async createMeetLink(details: MeetingDetails): Promise<string> {
    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;

    const hasCredentials = Boolean(clientId && clientSecret && refreshToken);

    if (!hasCredentials) {
      console.log('ℹ️ Google Calendar credentials not found in env. Falling back to Mock Google Meet link generation.');
      return this.generateMockMeetLink();
    }

    try {
      // 1. Get Google OAuth access token using refresh token
      const tokenUrl = 'https://oauth2.googleapis.com/token';
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: clientSecret!,
          refresh_token: refreshToken!,
          grant_type: 'refresh_token',
        }).toString(),
      });

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text();
        throw new Error(`Failed to refresh Google OAuth token: ${errText}`);
      }

      const tokenData = await tokenResponse.json() as any;
      const accessToken = tokenData.access_token;

      // 2. Create event on primary calendar with conferenceDataVersion=1 to request Google Meet
      const createEventUrl = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1';
      const requestId = crypto.randomUUID();

      const eventBody = {
        summary: details.title,
        description: details.description,
        start: {
          dateTime: details.startDateTime,
          timeZone: 'UTC',
        },
        end: {
          dateTime: details.endDateTime,
          timeZone: 'UTC',
        },
        attendees: [
          { email: details.attendeeEmail }
        ],
        conferenceData: {
          createRequest: {
            requestId: requestId,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        }
      };

      const eventResponse = await fetch(createEventUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventBody),
      });

      if (!eventResponse.ok) {
        const errText = await eventResponse.text();
        throw new Error(`Failed to create Google Calendar event: ${errText}`);
      }

      const eventData = await eventResponse.json() as any;
      const meetLink = eventData.hangoutLink || eventData.conferenceData?.entryPoints?.[0]?.uri;

      if (!meetLink) {
        console.warn('⚠️ Google Calendar event created, but no Google Meet link was returned. Generating mock fallback.');
        return this.generateMockMeetLink();
      }

      console.log('✅ Google Calendar event & Meet link created successfully:', meetLink);
      return meetLink;
    } catch (error: any) {
      console.error('❌ Failed to book Google Calendar event. Falling back to Mock link:', error.message || error);
      return this.generateMockMeetLink();
    }
  }

  private static generateMockMeetLink(): string {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const part1 = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
    const part2 = Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
    const part3 = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
    return `https://meet.google.com/${part1}-${part2}-${part3}`;
  }
}
