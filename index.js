const Imap = require("imap");
const { simpleParser } = require("mailparser");
const imapConfig = {
  user: "jcpsimmons@gmail.com",
  password: process.env.GMAIL_PASS,
  host: "imap.gmail.com",
  port: 993,
  tls: true,
};

const emails = [];

const getEmails = () => {
  try {
    const imap = new Imap(imapConfig);
    imap.once("ready", () => {
      imap.openBox("INBOX", false, () => {
        imap.search(["UNSEEN", ["SINCE", new Date()]], (err, results) => {
          const f = imap.fetch(results, { bodies: "" });
          f.on("message", (msg) => {
            msg.on("body", (stream) => {
              simpleParser(stream, async (err, parsed) => {
                !!parsed && emails.push(parsed);
              });
            });
          });
          f.once("error", (ex) => {
            return Promise.reject(ex);
          });
          f.once("end", () => {
            console.log("Done fetching all messages!");
            imap.end();
          });
        });
      });
    });

    imap.once("error", (err) => {
      console.log(err);
    });

    imap.once("end", () => {
      const sortedEmails = emails
        .filter((item) => item?.text?.length)
        .sort((a, b) => a.text.length - b.text.length);
      const shortenedEmails = sortedEmails.slice(0, 3);
      console.log(shortenedEmails.map((s) => s.subject));

      console.log("Connection ended");
    });

    imap.connect();
  } catch (ex) {
    console.log("an error occurred");
  }
};

getEmails();
