/**
 * Formats homework submission for WhatsApp messaging
 * Statuses supported:
 * - done: ✅ Homework Done
 * - incomplete: ⚠️ Incomplete Homework
 * - not_done: ❌ Not Done
 * - absent: 🚫 Absent
 * 
 * Special Batch Statuses:
 * - holiday: 🏖️ Today is a Holiday
 * - no_homework: 📚 No Homework Assigned
 */

export const formatWhatsAppMessage = ({
  batchName,
  subject,
  date,
  batchStatus, // 'normal' | 'no_homework' | 'holiday'
  specialReason,
  entries = [], // [{ studentName, rollNo, status: 'done' | 'incomplete' | 'not_done' | 'absent', remarks: '' }]
  includeRemarks = true,
  repeatDefaulters = [] // [{ studentName, rollNo, consecutiveDays: 3 }]
}) => {
  const formattedDate = new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  if (batchStatus === 'holiday') {
    return `📢 *ATTENDANCE & HOMEWORK UPDATE*\n` +
      `🏫 *Batch:* ${batchName} ${subject ? `(${subject})` : ''}\n` +
      `📅 *Date:* ${formattedDate}\n\n` +
      `🏖️ *STATUS: TODAY IS A HOLIDAY*\n` +
      `${specialReason ? `📝 Note: ${specialReason}\n` : ''}\n` +
      `Enjoy your day off & stay safe! ✨`;
  }

  if (batchStatus === 'no_homework') {
    return `📢 *HOMEWORK UPDATE*\n` +
      `🏫 *Batch:* ${batchName} ${subject ? `(${subject})` : ''}\n` +
      `📅 *Date:* ${formattedDate}\n\n` +
      `📚 *STATUS: NO HOMEWORK ASSIGNED TODAY*\n` +
      `${specialReason ? `📝 Note: ${specialReason}\n` : ''}\n` +
      `Revise the topics covered in class today. 👍`;
  }

  const doneList = entries.filter(e => e.status === 'done');
  const incompleteList = entries.filter(e => e.status === 'incomplete');
  const notDoneList = entries.filter(e => e.status === 'not_done');
  const absentList = entries.filter(e => e.status === 'absent');

  let text = `📋 *DAILY HOMEWORK REPORT*\n`;
  text += `🏫 *Batch:* ${batchName} ${subject ? `(${subject})` : ''}\n`;
  text += `📅 *Date:* ${formattedDate}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Repeat 3-Day Defaulters Alert (Included if teacher selected "Add to WhatsApp")
  if (repeatDefaulters && repeatDefaulters.length > 0) {
    text += `⚠️ *URGENT ATTENTION - 3 CONSECUTIVE DAYS HW PENDING:*\n`;
    repeatDefaulters.forEach((d, idx) => {
      text += `🚨 ${idx + 1}. *${d.studentName}*${d.rollNo ? ` (#${d.rollNo})` : ''} - (Homework pending for 3+ consecutive sessions)\n`;
    });
    text += `_Parents, please check their notebooks immediately._\n`;
    text += `─────────────────────\n\n`;
  }

  // Summary counts
  text += `📊 *Summary:* Total: ${entries.length} | ✅ Done: ${doneList.length} | ⚠️ Incomplete: ${incompleteList.length} | ❌ Not Done: ${notDoneList.length} | 🚫 Absent: ${absentList.length}\n\n`;

  // NOT DONE list
  if (notDoneList.length > 0) {
    text += `❌ *HOMEWORK NOT DONE (${notDoneList.length}):*\n`;
    notDoneList.forEach((e, idx) => {
      const remarkText = (includeRemarks && e.remarks && e.remarks.trim()) ? ` - _(${e.remarks.trim()})_` : '';
      text += `${idx + 1}. ${e.studentName}${e.rollNo ? ` (#${e.rollNo})` : ''}${remarkText}\n`;
    });
    text += `\n`;
  }

  // INCOMPLETE list
  if (incompleteList.length > 0) {
    text += `⚠️ *INCOMPLETE WORK (${incompleteList.length}):*\n`;
    incompleteList.forEach((e, idx) => {
      const remarkText = (includeRemarks && e.remarks && e.remarks.trim()) ? ` - _(${e.remarks.trim()})_` : '';
      text += `${idx + 1}. ${e.studentName}${e.rollNo ? ` (#${e.rollNo})` : ''}${remarkText}\n`;
    });
    text += `\n`;
  }

  // ABSENT list
  if (absentList.length > 0) {
    text += `🚫 *ABSENT STUDENTS (${absentList.length}):*\n`;
    absentList.forEach((e, idx) => {
      const remarkText = (includeRemarks && e.remarks && e.remarks.trim()) ? ` - _(${e.remarks.trim()})_` : '';
      text += `${idx + 1}. ${e.studentName}${e.rollNo ? ` (#${e.rollNo})` : ''}${remarkText}\n`;
    });
    text += `\n`;
  }

  // DONE list
  if (doneList.length > 0) {
    text += `✅ *HOMEWORK COMPLETED (${doneList.length}):*\n`;
    doneList.forEach((e, idx) => {
      const remarkText = (includeRemarks && e.remarks && e.remarks.trim()) ? ` - _(${e.remarks.trim()})_` : '';
      text += `${idx + 1}. ${e.studentName}${remarkText}\n`;
    });
    text += `\n`;
  }

  if (notDoneList.length === 0 && incompleteList.length === 0) {
    text += `🎉 *All present students have completed their homework! Great job!*\n\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `_Please ensure incomplete or pending homework is finished for the next class._`;

  return text;
};

export const sendFastShare = async (messageText, groupLink = '', phoneNumber = '') => {
  if (groupLink && groupLink.trim().includes('chat.whatsapp.com')) {
    try {
      await navigator.clipboard.writeText(messageText);
    } catch (e) {
      console.warn("Clipboard write failed", e);
    }
    window.location.href = groupLink.trim();
    return { type: 'group_link_opened', copied: true };
  }

  if (phoneNumber && phoneNumber.trim()) {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(messageText);
    window.location.href = `whatsapp://send?phone=${cleanPhone}&text=${encoded}`;
    return { type: 'direct_phone' };
  }

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Daily Homework Report',
        text: messageText,
      });
      return { type: 'native_share_success' };
    } catch (err) {
      if (err.name === 'AbortError') return { type: 'cancelled' };
    }
  }

  const encoded = encodeURIComponent(messageText);
  window.location.href = `whatsapp://send?text=${encoded}`;
  return { type: 'whatsapp_app_scheme' };
};

export const copyToClipboard = async (text) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  } catch (err) {
    document.body.removeChild(textArea);
    return false;
  }
};
