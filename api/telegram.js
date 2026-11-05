export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { message } = req.body;
  if (!message || !message.text) return res.status(200).end();

  const chatId = message.chat.id;
  const text = message.text.trim();

  const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
  if (String(chatId) !== String(ADMIN_CHAT_ID)) {
    await sendMessage(chatId, "❌ Bạn không có quyền điều khiển bot này.");
    return res.status(200).end();
  }

  const [command, ...args] = text.split(' ');
  const value = args.join(' ');

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO = process.env.GITHUB_REPO; // Lúc điền trên Vercel nhớ điền tên Repo MỚI
  const FILE_PATH = 'data.json';

  try {
    const getRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'TelegramBot' }
    });
    const fileData = await getRes.json();
    const currentContent = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf-8'));
    const sha = fileData.sha;

    let updated = false;
    let replyMsg = '';

    switch (command) {
      case '/setname': currentContent.name = value; replyMsg = `✅ Đã đổi tên thành: ${value}`; updated = true; break;
      case '/setavatar': currentContent.avatar = value; replyMsg = `✅ Đã đổi avatar.`; updated = true; break;
      case '/setcover': currentContent.cover = value; replyMsg = `✅ Đã đổi ảnh bìa.`; updated = true; break;
      case '/setbio': currentContent.bio = value; replyMsg = `✅ Đã đổi bio.`; updated = true; break;
      case '/setfacebook': currentContent.facebook = value; replyMsg = `✅ Đã đổi link Facebook.`; updated = true; break;
      case '/setdiscord': currentContent.discord = value; replyMsg = `✅ Đã đổi link Discord.`; updated = true; break;
      case '/setzalo': currentContent.zalo = value; replyMsg = `✅ Đã đổi link Zalo.`; updated = true; break;
      case '/settelegram': currentContent.telegram = value; replyMsg = `✅ Đã đổi link Telegram.`; updated = true; break;
      
      case '/setnhac': 
        currentContent.music = value; 
        replyMsg = `✅ Đã cập nhật link nhạc mới.`; 
        updated = true; 
        break;

      case '/addreview': 
        const parts = value.split('|');
        if (parts.length >= 2) {
          const name = parts[0].trim();
          const comment = parts[1].trim();
          if (!currentContent.reviews) currentContent.reviews = [];
          currentContent.reviews.unshift({ name: name, comment: comment });
          replyMsg = `✅ Đã thêm đánh giá của "${name}".`;
          updated = true;
        } else {
          replyMsg = `⚠️ Cú pháp sai. Vui lòng dùng:\n/addreview Tên khách | Nội dung đánh giá`;
        }
        break;

      case '/help': replyMsg = `🤖 Lệnh:\n/setname [tên]\n/setavatar [link]\n/setcover [link]\n/setbio [mô tả]\n/setfacebook [link]\n/setdiscord [link]\n/setzalo [link]\n/settelegram [link]\n/setnhac [link mp3]\n/addreview Tên | Nội dung\n/view`; await sendMessage(chatId, replyMsg); return res.status(200).end();
      default: await sendMessage(chatId, "❓ Lệnh không hợp lệ. Gõ /help."); return res.status(200).end();
    }

    if (updated) {
      await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'TelegramBot', 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Update via Bot: ${command}`, content: Buffer.from(JSON.stringify(currentContent, null, 2)).toString('base64'), sha: sha })
      });
      await sendMessage(chatId, replyMsg);
    }
  } catch (error) {
    await sendMessage(chatId, `❌ Lỗi: ${error.message}`);
  }
  res.status(200).end();
}

async function sendMessage(chatId, text) {
  const token = process.env.TELEGRAM_TOKEN;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML' })
  });
      }
