# -*- coding: utf-8 -*-
import codecs

path = r'c:\Users\ASUS\Documents\Website\kader-panel-pmii-justicia\public\pages\dashboard.html'

html_content = """<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dashboard - Kader Panel PMII Justicia</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<style>
:root{--sidebar-w:260px;--header-h:64px;--primary:#1a237e;--bg:#f0f2f5;--bg-card:#fff;--text:#212121;--text2:#616161;--border:#e0e0e0;--shadow:0 2px 8px rgba(0,0,0,.08);--radius:12px;--radius-sm:8px;--transition:.3s}
[data-theme="dark"]{--bg:#0f1219;--bg-card:#1a1f2e;--text:#e8eaed;--text2:#9aa0a6;--border:#2d3348;--shadow:0 2px 8px rgba(0,0,0,.3)}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden;min-height:100vh;transition:background var(--transition),color var(--transition)}
.dash-layout{display:flex;min-height:100vh}
.sidebar{position:fixed;left:0;top:0;bottom:0;width:var(--sidebar-w);background:linear-gradient(180deg,#1a237e,#0d1466);color:#fff;z-index:1000;overflow-y:auto;transition:transform var(--transition);display:flex;flex-direction:column}
.sidebar-brand{padding:18px 20px;border-bottom:1px solid rgba(255,255,255,.1);display:flex;align-items:center;gap:12px}
.sidebar-brand .brand-icon{width:40px;height:40px;background:rgba(255,255,255,.15);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0}
.sidebar-brand h2{font-size:1rem;font-weight:700;line-height:1.3}
.sidebar-brand small{font-size:.7rem;opacity:.7;display:block}
.sidebar-nav{padding:12px 0;flex:1}
.sidebar-label{padding:8px 20px 4px;font-size:.65rem;text-transform:uppercase;letter-spacing:1.5px;opacity:.5;font-weight:600}
.sidebar-link{display:flex;align-items:center;gap:12px;padding:10px 20px;color:rgba(255,255,255,.7);text-decoration:none;font-size:.85rem;transition:var(--transition);border-left:3px solid transparent;cursor:pointer}
.sidebar-link:hover{background:rgba(255,255,255,.08);color:#fff}
.sidebar-link.active{background:rgba(255,255,255,.12);color:#fff;border-left-color:#ffd600}
.sidebar-link i{width:20px;text-align:center;font-size:1rem}
.sidebar-footer{padding:16px 20px;border-top:1px solid rgba(255,255,255,.1);font-size:.75rem;opacity:.5;text-align:center}
.main-area{margin-left:var(--sidebar-w);flex:1;min-height:100vh;display:flex;flex-direction:column}
.topbar{background:var(--bg-card);height:var(--header-h);display:flex;align-items:center;padding:0 24px;gap:16px;border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100;transition:background var(--transition),border var(--transition)}
.topbar-left{display:flex;align-items:center;gap:12px}
.hamburger{display:none;background:none;border:none;color:var(--text);font-size:1.3rem;cursor:pointer;padding:4px}
.topbar-right{display:flex;align-items:center;gap:12px;margin-left:auto}
.theme-btn{background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text2);font-size:1rem;transition:var(--transition)}
.theme-btn:hover{color:var(--primary);border-color:var(--primary)}
.topbar-clock{font-size:.8rem;color:var(--text2);text-align:right;line-height:1.3}
.topbar-clock .clock-time{font-weight:700;font-size:.95rem;color:var(--text)}
.topbar-user{display:flex;align-items:center;gap:10px;padding:4px 8px;border-radius:var(--radius-sm);transition:var(--transition);cursor:pointer}
.topbar-user:hover{background:var(--bg)}
.topbar-user .u-avatar{width:34px;height:34px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.8rem;flex-shrink:0}
.topbar-user .u-info{line-height:1.2}
.topbar-user .u-name{font-size:.85rem;font-weight:600}
.topbar-user .u-role{font-size:.7rem;color:var(--text2)}
.dash-content{padding:24px;flex:1}
.page-title{font-size:1.5rem;font-weight:700;margin-bottom:4px}
.page-subtitle{font-size:.85rem;color:var(--text2);margin-bottom:24px}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px}
.stat-card{background:var(--bg-card);border-radius:var(--radius);padding:20px;border:1px solid var(--border);transition:var(--transition);position:relative;overflow:hidden}
.stat-card:hover{transform:translateY(-2px);box-shadow:var(--shadow)}
.sib{width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;margin-bottom:14px;flex-shrink:0}
.sl{font-size:.8rem;color:var(--text2);margin-bottom:4px}
.sv{font-size:1.8rem;font-weight:800;line-height:1.2}
.sib.purple{background:#e8eaf6;color:#1a237e}
.sib.green{background:#e8f5e9;color:#2e7d32}
.sib.orange{background:#fff3e0;color:#e65100}
.sib.blue{background:#e3f2fd;color:#1565c0}
.sib.red{background:#fce4ec;color:#c62828}
.sib.teal{background:#e0f2f1;color:#00695c}
[data-theme="dark"] .sib.purple{background:rgba(26,35,126,.3)}
[data-theme="dark"] .sib.green{background:rgba(46,125,50,.3)}
[data-theme="dark"] .sib.orange{background:rgba(230,81,0,.3)}
[data-theme="dark"] .sib.blue{background:rgba(21,101,192,.3)}
[data-theme="dark"] .sib.red{background:rgba(198,40,40,.3)}
[data-theme="dark"] .sib.teal{background:rgba(0,105,92,.3)}
.dash-grid{display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:24px}
@media(max-width:900px){.dash-grid{grid-template-columns:1fr}}
.card{background:var(--bg-card);border-radius:var(--radius);border:1px solid var(--border);overflow:hidden;transition:background var(--transition),border var(--transition)}
.card-hd{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.card-hd h3{font-size:.95rem;font-weight:700}
.card-hd .ca{font-size:.8rem;color:var(--primary);cursor:pointer;text-decoration:none}
.card-bd{padding:16px 20px}
.ai{padding:12px 0;border-bottom:1px solid var(--border);display:flex;gap:12px}
.ai:last-child{border-bottom:none}
.ai-icon{width:36px;height:36px;border-radius:8px;background:var(--bg);display:flex;align-items:center;justify-content:center;font-size:.9rem;color:var(--primary);flex-shrink:0}
.ai-info{flex:1;min-width:0}
.ai-title{font-size:.85rem;font-weight:600;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ai-meta{font-size:.75rem;color:var(--text2);display:flex;gap:8px}
.ei{padding:10px 0;border-bottom:1px solid var(--border);display:flex;gap:12px;align-items:flex-start}
.ei:last-child{border-bottom:none}
.ed{width:40px;text-align:center;flex-shrink:0}
.ed .ed-d{font-size:1.1rem;font-weight:800;display:block;line-height:1.1}
.ed .ed-m{font-size:.65rem;text-transform:uppercase;color:var(--text2);display:block}
.ei .einfo{flex:1;min-width:0}
.ei .einfo .et{font-size:.85rem;font-weight:600;margin-bottom:2px}
.ei .einfo .em{font-size:.75rem;color:var(--text2);display:flex;gap:8px;flex-wrap:wrap}
.e-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:4px}
.uic{display:flex;flex-direction:column;align-items:center;padding:24px 20px;text-align:center}
.uia{width:72px;height:72px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.8rem;font-weight:700;margin-bottom:12px;flex-shrink:0}
.uin{font-size:1.1rem;font-weight:700;margin-bottom:2px}
.uir{font-size:.85rem;color:var(--primary);font-weight:600;margin-bottom:4px}
.uie{font-size:.8rem;color:var(--text2);margin-bottom:12px}
.uis{display:flex;gap:20px;width:100%;justify-content:center;border-top:1px solid var(--border);padding-top:12px;margin-top:8px}
.uis-item{text-align:center}
.uis-item .uis-v{font-size:1.1rem;font-weight:700;display:block}
.uis-item .uis-l{font-size:.7rem;color:var(--text2);text-transform:uppercase}
.ls{display:flex;justify-content:center;align-items:center;min-height:160px;color:var(--text2);gap:10px}
.ls i{font-size:2rem;animation:spin 1s linear infinite}
@keyframes spin{100%{transform:rotate(360deg)}}
.emp{padding:40px 20px;text-align:center;color:var(--text2)}
.emp i{font-size:2.5rem;margin-bottom:8px;display:block;opacity:.5}
@media(max-width:768px){
  .sidebar{transform:translateX(-100%)}
  .sidebar.open{transform:translateX(0)}
  .main-area{margin-left:0}
  .hamburger{display:block}
  .topbar-clock{display:none}
  .dash-content{padding:16px}
  .stats-grid{grid-template-columns:repeat(2,1fr)}
}
</style>
</head>
<body>
<div class="dash-layout">
<aside class="sidebar" id="sidebar">
<div class="sidebar-brand">
<div class="brand-icon"><i class="fas fa-people-arrows"></i></div>
<div><h2>Kader Panel</h2><small>PMII Justicia UNESA</small></div>
<nav class="sidebar-nav">
<div class="sidebar-label">Menu</div>
<a class="sidebar-link active" href="dashboard.html"><i class="fas fa-th-large"></i> Dashboard</a>
<a class="sidebar-link" href="users.html"><i class="fas fa-users"></i> Pengguna</a>
<a class="sidebar-link" href="organization.html"><i class="fas fa-sitemap"></i> Struktur</a>
<a class="sidebar-link" href="calendar.html"><i class="fas fa-calendar"></i> Event</a>
<a class="sidebar-link" href="announcements.html"><i class="fas fa-bullhorn"></i> Pengumuman</a>
<div class="sidebar-label">Akun</div>
<a class="sidebar-link" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Keluar</a>
</nav>
<div class="sidebar-footer">PMII Rayon Justicia &copy; 2025</div>
</aside>
<div class="main-area">
<header class="topbar">
<div class="topbar-left">
<button class="hamburger" id="hamburger"><i class="fas fa-bars"></i></button>
<strong style="color:var(--primary)"><i class="fas fa-tachometer-alt"></i> Dashboard</strong>
</div>
<div class="topbar-right">
<div class="topbar-clock"><div class="clock-time" id="clockTime">--:--:--</div><div id="clockDate">---, -- --- ----</div>
<button class="theme-btn" id="themeToggle"><i class="fas fa-moon"></i></button>
<div class="topbar-user"><div class="u-avatar" id="userAvatar">K</div><div class="u-info"><div class="u-name" id="userName">Kader</div><div class="u-role" id="userRole">-</div></div>
</header>
<main class="dash-content">
<h1 class="page-title">Dashboard</h1>
<p class="page-subtitle">Selamat datang kembali, <strong id="welcomeUser">Kader</strong>!</p>
<div class="stats-grid" id="statsGrid">
<div class="stat-card"><div class="sib purple"><i class="fas fa-users"></i></div><div class="sl">Total Anggota</div><div class="sv" id="statTotal">-</div>
<div class="stat-card"><div class="sib green"><i class="fas fa-user-check"></i></div><div class="sl">Anggota Aktif</div><div class="sv" id="statActive">-</div>
<div class="stat-card"><div class="sib orange"><i class="fas fa-calendar-check"></i></div><div class="sl">Event Hari Ini</div><div class="sv" id="statToday">0</div>
<div class="stat-card"><div class="sib blue"><i class="fas fa-calendar-week"></i></div><div class="sl">Event Minggu Ini</div><div class="sv" id="statWeek">0</div>
<div class="stat-card"><div class="sib teal"><i class="fas fa-layer-group"></i></div><div class="sl">Total Bidang</div><div class="sv" id="statDiv">-</div>
<div class="stat-card"><div class="sib red"><i class="fas fa-bullhorn"></i></div><div class="sl">Pengumuman</div><div class="sv" id="statAnn">-</div>
</div>
<div class="dash-grid">
<div class="card">
<div class="card-hd"><h3><i class="fas fa-bullhorn"></i> Pengumuman Terbaru</h3><a href="announcements.html" class="ca">Lihat Semua &rarr;</a></div>
<div class="card-bd" id="annList"><div class="ls"><i class="fas fa-spinner"></i> Memuat...</div>
</div>
<div>
<div class="card" style="margin-bottom:20px">
<div class="card-hd"><h3><i class="fas fa-user-circle"></i> Profil Saya</h3></div>
<div class="card-bd" id="profileCard"><div class="ls"><i class="fas fa-spinner"></i> Memuat...</div>
</div>
<div class="card">
<div class="card-hd"><h3><i class="fas fa-calendar-alt"></i> Event Mendatang</h3><a href="calendar.html" class="ca">Lihat</a></div>
<div class="card-bd" id="evtList"><div class="ls"><i class="fas fa-spinner"></i> Memuat...</div>
</div>
</div>
</main>
</div>
<script>
function $(i){return document.getElementById(i)}
function init(n){if(!n)return'?';return n.split(' ').map(function(w){return w[0]}).join('').substring(0,2).toUpperCase()}
function gm(d){var m=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];return m[d.getMonth()]}
function gd(d){var h=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];return h[d.getDay()]}
function fd(d){var n=new Date(d);return gd(n)+', '+n.getDate()+' '+gm(n)+' '+n.getFullYear()}
var tt=$('themeToggle'),ti=tt.querySelector('i');
if(localStorage.getItem('theme')==='dark'||(!localStorage.getItem('theme')&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.setAttribute('data-theme','dark');ti.className='fas fa-sun';}
tt.onclick=function(){var t=document.documentElement.getAttribute('data-theme');if(t==='dark'){document.documentElement.removeAttribute('data-theme');localStorage.setItem('theme','light');ti.className='fas fa-moon';}else{document.documentElement.setAttribute('data-theme','dark');localStorage.setItem('theme','dark');ti.className='fas fa-sun';}};
function updClock(){var d=new Date().toLocaleString('id-ID',{timeZone:'Asia/Jakarta'});var n=new Date(d);var h=String(n.getHours()).padStart(2,'0');var m=String(n.getMinutes()).padStart(2,'0');var s=String(n.getSeconds()).padStart(2,'0');$('clockTime').textContent=h+':'+m+':'+s+' WIB';$('clockDate').textContent=gd(n)+', '+n.getDate()+' '+gm(n)+' '+n.getFullYear();}
setInterval(updClock,1000);updClock();
$('hamburger').onclick=function(){$('sidebar').classList.toggle('open');};
document.addEventListener('DOMContentLoaded',async function(){
  try{var r=await fetch('/api/auth/me',{credentials:'include'});var d=await r.json();if(!d.authenticated){window.location.href='../index.html';return;}
    var u=d.user;$('welcomeUser').textContent=u.full_name||u.username;$('userName').textContent=u.full_name||u.username;$('userRole').textContent=u.role;$('userAvatar').textContent=init(u.full_name||u.username);
    var ph='<div class="uic"><div class="uia">'+init(u.full_name||u.username)+'</div><div class="uin">'+(u.full_name||u.username)+'</div><div class="uir">'+u.role+'</div><div class="uie">'+(u.email||'-')+'</div><div class="uis"><div class="uis-item"><span class="uis-v">'+(u.username||'-')+'</span><span class="uis-l">Username</span></div><div class="uis-item"><span class="uis-v">Aktif</span><span class="uis-l">Status</span></div></div>';
    $('profileCard').innerHTML=ph;
  }catch(e){window.location.href='../index.html';return;}
  $('logoutBtn').onclick=async function(){await fetch('/api/auth/logout',{method:'POST',credentials:'include'});window.location.href='../index.html';};
  loadAnnouncements();loadEvents();loadStats();
});
async function loadAnnouncements(){
  try{var r=await fetch('/api/announcements',{credentials:'include'});var d=await r.json();var items=d.announcements||d.data||[];
    if(items.length===0){$('annList').innerHTML='<div class="emp"><i class="fas fa-inbox"></i><p>Belum ada pengumuman</p></div>';return;}
    var h='';var max=Math.min(items.length,5);
    for(var i=0;i<max;i++){var a=items[i];
