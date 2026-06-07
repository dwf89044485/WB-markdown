function downloadTextAsFile(text, filename, type = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type: type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(function () {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 0);
}

const showIframeDialog = (title, url, height, width, type = 1) => {
  const isMobileVal = isMobile();
  width = isMobileVal
    ? $(window).width()
    : width || Math.min($(window).width(), 1024);
  height = isMobileVal
    ? $(window).height()
    : height || Math.min($(window).height(), 800);
  layer.open({
    type: type, //1 html 2 url
    title: [title, "font-size: 18px;"],
    shadeClose: true,
    shade: 0.2,
    maxmin: true,
    scrollbar: false,
    offset: "auto",
    area: [`${width}px`, `${height}px`],
    content: url,
  });
};

Date.prototype.Format = function (fmt) {
  var o = {
    "M+": this.getMonth() + 1, //月份
    "d+": this.getDate(), //日
    "H+": this.getHours(), //小时
    "m+": this.getMinutes(), //分
    "s+": this.getSeconds(), //秒
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度
    S: this.getMilliseconds(), //毫秒
  };
  if (/(y+)/.test(fmt))
    fmt = fmt.replace(
      RegExp.$1,
      (this.getFullYear() + "").substr(4 - RegExp.$1.length)
    );
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt))
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length)
      );
  return fmt;
};

const isMobile = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(
    userAgent
  );
};

const setLoading = (msg) => {
  const loading = layer.msg(msg, {
    icon: 16,
    shade: 0.01,
    // time: 0,
  });
  return loading;
};

const CommonUtil = {
  createElement: function (tag, options = {}) {
    const element = document.createElement(tag);
    if (options.text) {
      element.textContent = options.text;
    }
    if (options.html) {
      element.innerHTML = options.html;
    }
    if (options.style) {
      Object.assign(element.style, options.style);
    }
    if (options.className) {
      element.className = options.className;
    }
    if (options.attributes) {
      for (let [key, value] of Object.entries(options.attributes)) {
        element.setAttribute(key, value);
      }
    }
    if (options.childrens) {
      options.childrens.forEach((child) => {
        element.appendChild(child);
      });
    }
    return element;
  },
  openInTab: function (
    url,
    options = { active: true, insert: true, setParent: true }
  ) {
    if (typeof GM_openInTab === "function") {
      GM_openInTab(url, options);
    } else {
      GM.openInTab(url, options);
    }
  },
  waitForElementByInterval: function (
    selector,
    target = document.body,
    allowEmpty = true,
    delay = 10,
    maxDelay = 10 * 1e3
  ) {
    return new Promise((resolve, reject) => {
      let totalDelay = 0;
      let element = target.querySelector(selector);
      let result = allowEmpty ? !!element : !!element && !!element.innerHTML;
      if (result) {
        resolve(element);
      }
      const elementInterval = setInterval(() => {
        if (totalDelay >= maxDelay) {
          clearInterval(elementInterval);
          resolve(null);
        }
        element = target.querySelector(selector);
        result = allowEmpty ? !!element : !!element && !!element.innerHTML;
        if (result) {
          clearInterval(elementInterval);
          resolve(element);
        } else {
          totalDelay += delay;
        }
      }, delay);
    });
  },
};

const HtmlToMarkdown = {
  to: function (html, platform) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const isChatGPT = platform === "chatGPT",
      isGemini = platform === "gemini",
      isGrok = platform === "grok";
    if (!isGemini) {
      doc
        .querySelectorAll("span.katex-html")
        .forEach((element) => element.remove());
    }
    doc.querySelectorAll("mrow").forEach((mrow) => mrow.remove());
    doc
      .querySelectorAll('annotation[encoding="application/x-tex"]')
      .forEach((element) => {
        if (element.closest(".katex-display")) {
          const latex = element.textContent;
          const trimmedLatex = latex.trim();
          element.replaceWith(`
$$
${trimmedLatex}
$$
`);
        } else {
          const latex = element.textContent;
          const trimmedLatex = latex.trim();
          element.replaceWith(`$${trimmedLatex}$`);
        }
      });
    doc.querySelectorAll("strong, b").forEach((bold) => {
      const markdownBold = `**${bold.textContent}**`;
      bold.parentNode.replaceChild(document.createTextNode(markdownBold), bold);
    });
    doc.querySelectorAll("em, i").forEach((italic) => {
      const markdownItalic = `*${italic.textContent}*`;
      italic.parentNode.replaceChild(
        document.createTextNode(markdownItalic),
        italic
      );
    });
    doc.querySelectorAll("p code").forEach((code) => {
      const markdownCode = `\`${code.textContent}\``;
      code.parentNode.replaceChild(document.createTextNode(markdownCode), code);
    });
    doc.querySelectorAll("a").forEach((link) => {
      const markdownLink = `[${link.textContent}](${link.href})`;
      link.parentNode.replaceChild(document.createTextNode(markdownLink), link);
    });
    doc.querySelectorAll("img").forEach((img) => {
      const markdownImage = `![${img.alt}](${img.src})`;
      img.parentNode.replaceChild(document.createTextNode(markdownImage), img);
    });
    if (isChatGPT) {
      doc.querySelectorAll("pre").forEach((pre) => {
        const codeType =
          pre.querySelector("div > div:first-child")?.textContent || "";
        const markdownCode =
          pre.querySelector("div > div:nth-child(3) > code")?.textContent ||
          pre.textContent;
        pre.innerHTML = `
\`\`\`${codeType}
${markdownCode}
\`\`\``;
      });
    } else if (isGrok) {
      doc.querySelectorAll("div.not-prose").forEach((div) => {
        const codeType =
          div.querySelector("div > div > span")?.textContent || "";
        const markdownCode =
          div.querySelector("div > div:nth-child(3) > code")?.textContent ||
          div.textContent;
        div.innerHTML = `
\`\`\`${codeType}
${markdownCode}
\`\`\``;
      });
    } else if (isGemini) {
      doc.querySelectorAll("code-block").forEach((div) => {
        const codeType =
          div.querySelector("div > div > span")?.textContent || "";
        const markdownCode =
          div.querySelector("div > div:nth-child(2) > div > pre")
            ?.textContent || div.textContent;
        div.innerHTML = `
\`\`\`${codeType}
${markdownCode}
\`\`\``;
      });
    }
    doc.querySelectorAll("ul").forEach((ul) => {
      let markdown2 = "";
      ul.querySelectorAll(":scope > li").forEach((li) => {
        markdown2 += `- ${li.textContent.trim()}
`;
      });
      ul.parentNode.replaceChild(
        document.createTextNode("\n" + markdown2.trim()),
        ul
      );
    });
    doc.querySelectorAll("ol").forEach((ol) => {
      let markdown2 = "";
      ol.querySelectorAll(":scope > li").forEach((li, index) => {
        markdown2 += `${index + 1}. ${li.textContent.trim()}
`;
      });
      ol.parentNode.replaceChild(
        document.createTextNode("\n" + markdown2.trim()),
        ol
      );
    });
    for (let i = 1; i <= 6; i++) {
      doc.querySelectorAll(`h${i}`).forEach((header) => {
        const markdownHeader = `
${"#".repeat(i)} ${header.textContent}
`;
        header.parentNode.replaceChild(
          document.createTextNode(markdownHeader),
          header
        );
      });
    }
    doc.querySelectorAll("p").forEach((p) => {
      const markdownParagraph = "\n" + p.textContent + "\n";
      p.parentNode.replaceChild(document.createTextNode(markdownParagraph), p);
    });
    doc.querySelectorAll("table").forEach((table) => {
      let markdown2 = "";
      table.querySelectorAll("thead tr").forEach((tr) => {
        tr.querySelectorAll("th").forEach((th) => {
          markdown2 += `| ${th.textContent} `;
        });
        markdown2 += "|\n";
        tr.querySelectorAll("th").forEach(() => {
          markdown2 += "| ---- ";
        });
        markdown2 += "|\n";
      });
      table.querySelectorAll("tbody tr").forEach((tr) => {
        tr.querySelectorAll("td").forEach((td) => {
          markdown2 += `| ${td.textContent} `;
        });
        markdown2 += "|\n";
      });
      table.parentNode.replaceChild(
        document.createTextNode("\n" + markdown2.trim() + "\n"),
        table
      );
    });
    let markdown = doc.body.innerHTML.replace(/<[^>]*>/g, "");
    markdown = markdown.replaceAll(/- &gt;/g, "- $\\gt$");
    markdown = markdown.replaceAll(/>/g, ">");
    markdown = markdown.replaceAll(/</g, "<");
    markdown = markdown.replaceAll(/≥/g, ">=");
    markdown = markdown.replaceAll(/≤/g, "<=");
    markdown = markdown.replaceAll(/≠/g, "\\neq");
    return markdown.trim();
  },
};

const Download = {
  start: function (data, filename, type) {
    var file = new Blob([data], { type });
    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(file, filename);
    } else {
      var a = document.createElement("a"),
        url = URL.createObjectURL(file);
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
    }
  },
};

const Chat = {
  sanitizeFilename: function (input, replacement = "_") {
    const illegalRe = /[\/\\\?\%\*\:\|"<>\.]/g;
    const controlRe = /[\x00-\x1f\x80-\x9f]/g;
    const reservedRe = /^\.+$/;
    const windowsReservedRe = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
    let name = input
      .replace(illegalRe, replacement)
      .replace(controlRe, replacement)
      .replace(/\s+/g, " ")
      .trim();
    if (reservedRe.test(name)) {
      name = "file";
    }
    if (windowsReservedRe.test(name)) {
      name = `file_${name}`;
    }
    return name || "untitled";
  },
  getConversationElements: function (platform) {
    const result = [];
    let title = "";
    if (platform == "chatGPT") {
      const convId = window.location.pathname.split("/c/")[1];
      if (!convId) {
        layer.msg("当前未进行任何会话｜No conversation");
        return;
      }
      title = document.querySelector("#history a[data-active]")?.textContent;
      result.push(...document.querySelectorAll("div[data-message-id]"));
    } else if (platform == "grok") {
      const convId = window.location.pathname.split("/c/")[1];
      if (!convId) {
        layer.msg("当前未进行任何会话｜No conversation");
        return;
      }
      result.push(...document.querySelectorAll("div.message-bubble"));
      title = "grok-chat-export";
    } else if (platform == "gemini") {
      const convId = window.location.pathname.split("app/")[1];
      if (!convId) {
        layer.msg("当前未进行任何会话｜No conversation");
        return;
      }
      title = document.querySelector(
        "conversations-list div.selected"
      )?.textContent;
      const userQueries = document.querySelectorAll("user-query-content");
      const modelResponses = document.querySelectorAll("model-response");
      for (let i = 0; i < userQueries.length; i++) {
        if (i < modelResponses.length) {
          result.push(userQueries[i]);
          result.push(modelResponses[i]);
        } else {
          result.push(userQueries[i]);
        }
      }
    }
    return { result: result, title: title };
  },
  exportChatAsMarkdown: function (platform, isDownload) {
    let markdownContent = "";
    const { result, title } = this.getConversationElements(platform);
    const filename = (this.sanitizeFilename(title) || "chat-export") + ".md";
    for (let i = 0; i < result.length; i += 2) {
      if (!result[i + 1]) {
        break;
      }
      let userText = result[i].textContent.trim();
      let answerHtml = result[i + 1].innerHTML.trim();
      userText = HtmlToMarkdown.to(userText, platform);
      answerHtml = HtmlToMarkdown.to(answerHtml, platform);
      markdownContent += `
# User:
${userText}
# Assistant:
${answerHtml}`;
    }
    markdownContent = markdownContent.replace(/&amp;/g, "&");
    if (markdownContent && isDownload) {
      Download.start(markdownContent, filename, "text/markdown");
    }
    return markdownContent;
  },
};
