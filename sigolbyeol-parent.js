(function () {
  const IFRAME_ORIGIN = 'https://hime-haruka.github.io';
  const IFRAME_SELECTOR = 'section[name="am-root"] iframe[src*="hime-haruka.github.io/SIGOLBYEOL_artmug"], [name="am-root"] iframe[src*="hime-haruka.github.io/SIGOLBYEOL_artmug"], iframe[src*="hime-haruka.github.io/SIGOLBYEOL_artmug"], #detailViews [name="am-root"] iframe, [name="am-root"] iframe';
  const STYLE_ID = 'sigolbyeol-artmug-parent-style';
  let lastHeight = 0;
  let viewportTimer = null;

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
html, body{
  overflow-x:hidden!important;
}

#detailViews [name="am-root"],
[name="am-root"]{
  text-align:start!important;
  padding:0!important;
  margin:0!important;
  line-height:normal!important;
  overflow:visible!important;
}

#detailViews [name="am-root"] *,
[name="am-root"] *{
  box-sizing:border-box;
}

#detailViews [name="stage"],
[name="stage"]{
  width:100%!important;
  overflow:visible!important;
}

#detailViews [name="am-root"] iframe,
[name="am-root"] iframe{
  display:block!important;
  width:100%!important;
  max-width:1180px!important;
  min-height:760px;
  height:760px;
  margin:0 auto!important;
  border:0!important;
  overflow:hidden!important;
}

.btn_open_btn,
.btn_open,
.btn_close{
  display:none!important;
  visibility:hidden!important;
  pointer-events:none!important;
}
`;
    document.head.appendChild(style);
  }

  function unlockDetail() {
    const box = document.querySelector('.detailinfo');
    if (!box) return;

    box.classList.remove('showstep1');
    box.style.maxHeight = 'none';
    box.style.height = 'auto';
    box.style.overflow = 'visible';

    const content = box.querySelector('.showcontent');
    if (content) {
      content.style.maxHeight = 'none';
      content.style.height = 'auto';
      content.style.overflow = 'visible';
    }
  }

  function removeMoreButtons(root = document) {
    root.querySelectorAll('.btn_open_btn,.btn_open,.btn_close').forEach(el => el.remove());
  }

  function hardBlockMoreButtons() {
    if (window.__sigolbyeolArtmugHardBlockClicks) return;
    window.__sigolbyeolArtmugHardBlockClicks = true;

    document.addEventListener('click', e => {
      const target = e.target && e.target.closest
        ? e.target.closest('.btn_open_btn,.btn_open,.btn_close')
        : null;

      if (!target) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }, true);
  }

  function getIframe() {
    return document.querySelector(IFRAME_SELECTOR);
  }

  function sendViewportToIframe() {
    const iframe = getIframe();
    if (!iframe || !iframe.contentWindow) return;

    const rect = iframe.getBoundingClientRect();

    iframe.contentWindow.postMessage({
      source: 'syura-artmug-parent',
      type: 'SYURA_PARENT_VIEWPORT',
      iframeTop: rect.top,
      iframeLeft: rect.left,
      iframeWidth: rect.width,
      iframeHeight: rect.height,
      viewportWidth: window.innerWidth || document.documentElement.clientWidth || 0,
      viewportHeight: window.innerHeight || document.documentElement.clientHeight || 0,
      scrollY: window.scrollY || window.pageYOffset || 0
    }, IFRAME_ORIGIN);
  }

  function queueViewportSend() {
    clearTimeout(viewportTimer);
    viewportTimer = setTimeout(sendViewportToIframe, 30);
  }

  function resizeIframe(height) {
    const iframe = getIframe();
    if (!iframe) return;

    const nextHeight = Math.max(760, Math.ceil(Number(height) || 0));

    if (Math.abs(nextHeight - lastHeight) < 4) {
      queueViewportSend();
      return;
    }

    lastHeight = nextHeight;
    iframe.style.height = nextHeight + 'px';
    iframe.style.minHeight = nextHeight + 'px';
    iframe.style.maxHeight = 'none';
    iframe.style.overflow = 'hidden';
    iframe.height = String(nextHeight);
    iframe.setAttribute('height', String(nextHeight));
    iframe.setAttribute('scrolling', 'no');

    queueViewportSend();
  }

  function scrollParentTo(targetY, navHeight) {
    const iframe = getIframe();
    if (!iframe) return;

    const rect = iframe.getBoundingClientRect();
    const iframePageTop = (window.scrollY || window.pageYOffset || 0) + rect.top;

    const y = Math.max(
      0,
      iframePageTop + Number(targetY || 0) - Number(navHeight || 0) - 8
    );

    window.scrollTo({
      top: y,
      behavior: 'smooth'
    });

    setTimeout(sendViewportToIframe, 80);
    setTimeout(sendViewportToIframe, 350);
  }

  function bindMessages() {
    if (window.__sigolbyeolArtmugMessageBind) return;
    window.__sigolbyeolArtmugMessageBind = true;

    window.addEventListener('message', e => {
      if (e.origin !== IFRAME_ORIGIN) return;

      const data = e.data || {};
      if (data.source !== 'syura-css') return;

      if (data.type === 'SYURA_IFRAME_HEIGHT') {
        resizeIframe(data.height);
      }

      if (data.type === 'SYURA_IFRAME_READY') {
        setTimeout(sendViewportToIframe, 50);
        setTimeout(sendViewportToIframe, 300);
        setTimeout(sendViewportToIframe, 900);
      }

      if (data.type === 'SYURA_PARENT_SCROLL_TO') {
        scrollParentTo(data.targetY, data.navHeight);
      }

      if (data.type === 'SYURA_REQUEST_PARENT_VIEWPORT') {
        queueViewportSend();
      }
    });

    window.addEventListener('scroll', queueViewportSend, { passive: true });
    window.addEventListener('resize', queueViewportSend);
    window.addEventListener('orientationchange', () => {
      setTimeout(sendViewportToIframe, 250);
    });
  }

  function observePage() {
    if (window.__sigolbyeolArtmugObserver) return;

    window.__sigolbyeolArtmugObserver = new MutationObserver(() => {
      removeMoreButtons();
      unlockDetail();
    });

    window.__sigolbyeolArtmugObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  function neutralize() {
    injectStyle();
    removeMoreButtons();
    unlockDetail();
    hardBlockMoreButtons();
    bindMessages();
    observePage();
    queueViewportSend();
  }

  if (document.readyState !== 'loading') {
    neutralize();
  } else {
    document.addEventListener('DOMContentLoaded', neutralize);
  }

  setTimeout(neutralize, 300);
  setTimeout(neutralize, 1000);
  setTimeout(neutralize, 2000);
})();
