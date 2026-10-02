/* Governor's Tavern concept: open-now status + GSAP scrollytelling (static-first) */
(function(){
  "use strict";
  var root = document.documentElement;
  var yr = document.getElementById("yr"); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Hours (America/New_York) ---------- */
  // minutes from midnight; close > 1440 means after midnight
  var HOURS = {0:[720,1500],1:[720,1500],2:[720,1500],3:[720,1500],4:[720,1500],5:[720,1560],6:[720,1560]};
  var NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  function nyNow(){
    try{
      var p = new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",weekday:"short",hour:"numeric",minute:"numeric",hour12:false}).formatToParts(new Date());
      var o = {}; p.forEach(function(x){o[x.type]=x.value;});
      var dow = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(o.weekday);
      var h = parseInt(o.hour,10)%24, m = parseInt(o.minute,10);
      return {dow:dow, min:h*60+m};
    }catch(e){ var d=new Date(); return {dow:d.getDay(), min:d.getHours()*60+d.getMinutes()}; }
  }
  function fmt(min){ min = min%1440; var h=Math.floor(min/60), m=min%60; var ap = h>=12?"pm":"am"; h=h%12||12; return h+(m?":"+(m<10?"0":"")+m:"")+ap; }
  function fmtClose(min){ return (min%1440===0) ? "midnight" : fmt(min); }
  function nextOpen(dow){ for (var i=1;i<=7;i++){ var d=(dow+i)%7; if (HOURS[d]) return {d:d,i:i}; } return null; }
  function status(){
    var n = nyNow(), today = HOURS[n.dow], prev = HOURS[(n.dow+6)%7];
    // still open from yesterday (after midnight)
    if (prev && prev[1]>1440 && n.min < prev[1]-1440) return {open:true, short:"Open now · until "+fmtClose(prev[1]), long:"We’re open right now, pouring until "+fmtClose(prev[1])+".", today:"Open till "+fmtClose(prev[1]), dow:n.dow};
    if (today && n.min>=today[0] && n.min<today[1]) return {open:true, short:"Open now · until "+fmtClose(today[1]), long:"We’re open right now, pouring until "+fmtClose(today[1])+".", today:"Open till "+fmtClose(today[1]), dow:n.dow};
    if (today && n.min<today[0]) return {open:false, short:"Opens today at "+fmt(today[0]), long:"Closed right now. Doors open today at "+fmt(today[0])+".", today:"Opens "+fmt(today[0]), dow:n.dow};
    var nx = nextOpen(n.dow); var when = nx.i===1 ? "tomorrow" : NAMES[nx.d];
    return {open:false, short:"Closed now · opens "+when+" at "+fmt(HOURS[nx.d][0]), long:"Closed right now. We open "+when+" at "+fmt(HOURS[nx.d][0])+".", today:(today?"Closed now":"Closed today")+" · opens "+(nx.i===1?"tmrw":NAMES[nx.d].slice(0,3))+" "+fmt(HOURS[nx.d][0]), dow:n.dow};
  }
  function paintStatus(){
    var s = status();
    document.querySelectorAll("[data-status]").forEach(function(el){ el.textContent = s.short; });
    document.querySelectorAll("[data-status-long]").forEach(function(el){ el.textContent = s.long; });
    document.querySelectorAll("[data-today]").forEach(function(el){ el.textContent = s.today; });
    var hs = document.querySelector(".hero__status"); if (hs) hs.classList.toggle("is-open", s.open);
    document.querySelectorAll(".day").forEach(function(d){ d.classList.toggle("is-today", +d.getAttribute("data-dow")===s.dow); });
  }
  paintStatus(); setInterval(paintStatus, 60000);

  /* ---------- Nav state ---------- */
  var nav = document.querySelector(".nav");
  function onScroll(){ if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, {passive:true}); onScroll();

  /* ---------- Timeline fill element ---------- */
  var tlist = document.querySelector(".timeline");
  if (tlist){ var f=document.createElement("span"); f.className="timeline__fill"; f.setAttribute("aria-hidden","true"); tlist.prepend(f); }

  /* ---------- Motion ---------- */
  if (!window.gsap || !window.ScrollTrigger) return;             // static layout stays
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduce.matches) return;                                     // reduced-motion: static
  gsap.registerPlugin(ScrollTrigger);
  root.classList.add("motion-ok");

  var lenis = null;
  var mm = gsap.matchMedia();

  /* shared: menu, taps board, timeline, days, polaroids */
  mm.add("(min-width: 0px)", function(){
    gsap.utils.toArray(".menu__row").forEach(function(row){
      var l = row.querySelector(".slide-l"), r = row.querySelector(".slide-r");
      var tl = gsap.timeline({scrollTrigger:{trigger:row, start:"top 82%", once:true}});
      if (l) tl.from(l,{x:-70, opacity:0, duration:.9, ease:"power3.out"},0);
      if (r) tl.from(r,{x:70, opacity:0, duration:.9, ease:"power3.out"},.08);
      var items = row.querySelectorAll(".items li");
      if (items.length) tl.from(items,{y:14, opacity:0, stagger:.05, duration:.45, ease:"power2.out"},.35);
    });
    gsap.from(".menu__head > *",{y:26, opacity:0, stagger:.1, duration:.8, ease:"power3.out", scrollTrigger:{trigger:".menu__head", start:"top 85%", once:true}});

    gsap.from(".board",{rotation:-2.5, y:60, opacity:0, duration:1, ease:"power3.out", scrollTrigger:{trigger:".board", start:"top 85%", once:true}});
    gsap.from(".board__list li, .board__mini li",{x:-18, opacity:0, stagger:.045, duration:.5, ease:"power2.out", scrollTrigger:{trigger:".board", start:"top 70%", once:true}});
    gsap.from(".board__chalk",{opacity:0, scale:.8, duration:.6, delay:.3, scrollTrigger:{trigger:".board__chalk", start:"top 95%", once:true}});

    gsap.to(".timeline__fill",{scaleY:1, ease:"none", scrollTrigger:{trigger:".timeline", start:"top 70%", end:"bottom 60%", scrub:.6, refreshPriority:-1}});
    gsap.utils.toArray(".tl").forEach(function(li){
      gsap.from(li,{x:30, opacity:0, duration:.8, ease:"power3.out", scrollTrigger:{trigger:li, start:"top 85%", once:true, refreshPriority:-1}});
    });

    gsap.from(".day",{rotationX:-95, opacity:0, stagger:.08, duration:.8, ease:"back.out(1.4)", scrollTrigger:{trigger:".days", start:"top 85%", once:true, refreshPriority:-1}});
    gsap.from(".note",{y:30, opacity:0, stagger:.1, duration:.7, ease:"power2.out", scrollTrigger:{trigger:".week__notes", start:"top 88%", once:true, refreshPriority:-1}});

    gsap.utils.toArray(".pol").forEach(function(el){ gsap.set(el,{rotation:parseFloat(el.style.getPropertyValue("--r"))||0}); });
    gsap.from(".pol",{y:80, opacity:0, stagger:{each:.06, from:"random"}, duration:.8, ease:"power3.out", scrollTrigger:{trigger:".polaroids", start:"top 85%", once:true, refreshPriority:-1}});
    gsap.from(".visit__info > *",{y:24, opacity:0, stagger:.07, duration:.7, ease:"power2.out", scrollTrigger:{trigger:".visit", start:"top 80%", once:true, refreshPriority:-1}});
  });

  /* desktop: pinned pour hero + pinned night story + Lenis */
  mm.add("(min-width: 901px)", function(){
    root.classList.add("motion-desk");
    if (window.Lenis){
      lenis = new Lenis({lerp:.1, smoothWheel:true}); window.__lenis = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function(t){ lenis && lenis.raf(t*1000); });
      gsap.ticker.lagSmoothing(0);
    }

    // HERO: pour a pint as you scroll
    gsap.set(".pint__beer",{y:480});
    gsap.set(".pint__foam",{scaleY:.3});
    var intro = gsap.timeline({delay:.15});
    intro.from(".hero__copy > *",{y:30, opacity:0, stagger:.1, duration:.9, ease:"power3.out"})
         .from(".pint",{y:40, opacity:0, duration:.9, ease:"power3.out"},.2)
         .to(".pint__beer",{y:420, duration:1.1, ease:"power2.out"},.5); // a small tease in the glass
    var pour = gsap.timeline({scrollTrigger:{trigger:".hero", start:"top top", end:"+=110%", pin:true, scrub:.7, anticipatePin:1}});
    pour.to(".pint__stream",{scaleY:1, duration:.08, ease:"none"},0)
        .to(".pint__beer",{y:80, duration:.8, ease:"power1.inOut"},0.04)
        .to(".pint__foam",{scaleY:1, duration:.3, ease:"none"},.55)
        .to(".pint__stream",{scaleY:0, transformOrigin:"bottom", duration:.08, ease:"none"},.84)
        .to(".pint__caption",{opacity:0, duration:.1},.1)
        .to(".hero__bg img",{scale:1.08, duration:1, ease:"none"},0)
        .to(".hero__copy",{y:-30, duration:1, ease:"none"},0);

    // NIGHT: pinned story with clip-path wipes
    var imgs = gsap.utils.toArray(".night__img"), panels = gsap.utils.toArray(".night__panel"), dots = gsap.utils.toArray(".night__progress li");
    gsap.set(imgs,{clipPath:"inset(0 0 0 100%)"}); gsap.set(imgs[0],{clipPath:"inset(0 0 0 0%)"});
    gsap.set(panels,{autoAlpha:0, y:40}); gsap.set(panels[0],{autoAlpha:1, y:0});
    function setDot(i){ dots.forEach(function(d,j){ d.classList.toggle("on", j<=i); }); }
    setDot(0);
    var story = gsap.timeline({scrollTrigger:{trigger:".night", start:"top top", end:"+=" + (panels.length*90) + "%", pin:true, scrub:.6, anticipatePin:1, refreshPriority:-1,
      onUpdate:function(st){ setDot(Math.min(panels.length-1, Math.floor(st.progress*panels.length*0.999 + .15))); }}});
    story.to(imgs[0],{scale:1.08, duration:1, ease:"none"},0);
    for (var i=1;i<panels.length;i++){
      var at = i;
      story.to(panels[i-1],{autoAlpha:0, y:-40, duration:.3, ease:"power2.in"}, at-.35)
           .to(imgs[i],{clipPath:"inset(0 0 0 0%)", duration:.6, ease:"power2.inOut"}, at-.4)
           .fromTo(imgs[i],{scale:1.15},{scale:1.02, duration:1, ease:"none"}, at-.4)
           .to(panels[i],{autoAlpha:1, y:0, duration:.35, ease:"power2.out"}, at-.05);
    }
    story.to({}, {duration:.4});
    gsap.from(".night__cta",{scale:.9, opacity:0, duration:.6, scrollTrigger:{trigger:".night", start:"top 60%", once:true}});

    // polaroid parallax
    gsap.utils.toArray(".pol").forEach(function(p,i){
      gsap.to(p,{yPercent: (i%2? -14 : 10), ease:"none", scrollTrigger:{trigger:".wall", start:"top bottom", end:"bottom top", scrub:true, refreshPriority:-1}});
    });
    gsap.to(".history__plaque",{rotation:2, y:-20, ease:"none", scrollTrigger:{trigger:".history", start:"top bottom", end:"bottom top", scrub:true, refreshPriority:-1}});

    return function(){
      root.classList.remove("motion-desk");
      if (lenis){ lenis.destroy(); lenis = null; }
    };
  });

  /* mobile: pour on load, stacked story fades */
  mm.add("(max-width: 900px)", function(){
    gsap.set(".pint__beer",{y:480});
    var tl = gsap.timeline({delay:.2});
    tl.from(".hero__copy > *",{y:24, opacity:0, stagger:.08, duration:.7, ease:"power3.out"})
      .to(".pint__stream",{scaleY:1, duration:.25, ease:"none"},.2)
      .to(".pint__beer",{y:80, duration:1.6, ease:"power2.out"},.35)
      .to(".pint__stream",{scaleY:0, transformOrigin:"bottom", duration:.25},1.7);
    gsap.utils.toArray(".night__panel").forEach(function(p){
      gsap.from(p,{y:50, opacity:0, duration:.8, ease:"power3.out", scrollTrigger:{trigger:p, start:"top 88%", once:true}});
    });
  });

  /* anchors: work with Lenis, offset for fixed nav */
  document.addEventListener("click", function(e){
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href"); if (id.length < 2 && id !== "#") return;
    var target = id === "#" || id === "#top" ? document.body : document.querySelector(id);
    if (!target) return;
    if (lenis){ e.preventDefault(); lenis.scrollTo(id==="#top"?0:target, {offset:(id==="#night"?0:-74), duration:1.2}); history.replaceState(null,"",id); }
  });

  window.addEventListener("load", function(){ ScrollTrigger.refresh(); });
})();
