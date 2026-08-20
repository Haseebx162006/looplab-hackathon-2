import { pool } from '../../db/index.js';
import { GoogleCalendarService } from '../admin-review/google-calendar.service.js';
import { sendEmail } from '../../utils/mailer.js';

export class BookingService {
  static async createRequest(userId: string, title: string, description: string) {
    if (!title || title.trim() === '') {
      throw { status: 400, message: 'Meeting title/topic is required.' };
    }

    const res = await pool.query(
      `INSERT INTO mentor_call_requests (user_id, title, description, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [userId, title, description || null]
    );
    return res.rows[0];
  }

  static async getUserRequests(userId: string) {
    const res = await pool.query(
      `SELECT * FROM mentor_call_requests 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    return res.rows;
  }

  static async getAdminRequests() {
    const res = await pool.query(
      `SELECT r.*, u.name as student_name, u.email as student_email
       FROM mentor_call_requests r
       JOIN users u ON r.user_id = u.id
       ORDER BY r.created_at DESC`
    );
    return res.rows;
  }

  static async respondToRequest(
    adminId: string,
    requestId: string,
    decision: 'approve' | 'reject',
    scheduledAt?: string,
    durationMinutes: number = 30,
    comment?: string
  ) {
    // 1. Get request and user email
    const reqCheck = await pool.query(
      `SELECT r.*, u.email as student_email, u.name as student_name
       FROM mentor_call_requests r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = $1`,
      [requestId]
    );
    const requestInfo = reqCheck.rows[0];
    if (!requestInfo) {
      throw { status: 404, message: 'Booking request not found.' };
    }

    if (requestInfo.status !== 'pending') {
      throw { status: 400, message: 'This request has already been processed.' };
    }

    if (decision === 'approve') {
      if (!scheduledAt) {
        throw { status: 400, message: 'scheduledAt date/time is required to approve the meeting.' };
      }

      const startTime = new Date(scheduledAt);
      const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

      // Book meeting
      const meetLink = await GoogleCalendarService.createMeetLink({
        title: `Mentor Session: ${requestInfo.title}`,
        description: requestInfo.description || '',
        startDateTime: startTime.toISOString(),
        endDateTime: endTime.toISOString(),
        attendeeEmail: requestInfo.student_email,
      });

      // Update in DB
      const updateRes = await pool.query(
        `UPDATE mentor_call_requests 
         SET status = 'approved', meet_link = $1, scheduled_at = $2, comment = $3
         WHERE id = $4 RETURNING *`,
        [meetLink, startTime.toISOString(), comment || null, requestId]
      );

      // Send email
      const emailSubject = 'Mentor Session Scheduled!';
      const emailBody = `Hello ${requestInfo.student_name},\n\nYour request for a mentor call has been approved!\n\nDetails:\n- Topic: ${requestInfo.title}\n- Time: ${startTime.toLocaleString()}\n- Meet Link: ${meetLink}\n\nBest regards,\nPersonalized Learning Platform Team`;
      
      await sendEmail(requestInfo.student_email, emailSubject, emailBody);

      return updateRes.rows[0];
    } else {
      // Reject request
      const updateRes = await pool.query(
        `UPDATE mentor_call_requests 
         SET status = 'rejected', comment = $1
         WHERE id = $2 RETURNING *`,
        [comment || null, requestId]
      );

      // Send email
      const emailSubject = 'Mentor Session Request Update';
      const emailBody = `Hello ${requestInfo.student_name},\n\nYour request for a mentor call has been rejected/deferred.\n\nReason/Comment: ${comment || 'No comment provided.'}\n\nBest regards,\nPersonalized Learning Platform Team`;
      
      await sendEmail(requestInfo.student_email, emailSubject, emailBody);

      return updateRes.rows[0];
    }
  }
}
