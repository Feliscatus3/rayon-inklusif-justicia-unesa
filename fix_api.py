"""Fix announcements API - add togglePin function and PATCH route"""
import os

path = r'c:\Users\ASUS\Documents\Website\kader-panel-pmii-justicia\api\announcements\index.js'
with open(path, 'r') as f:
    content = f.read()

print(f"Current size: {len(content)}")
print(f"Has togglePin: {'togglePin' in content}")
print(f"Has 'PATCH': {'PATCH' in content}")

# If togglePin function is missing entirely, we need to rebuild
if 'togglePin' not in content:
    print("Adding togglePin function...")
    
    # Find the last function and add togglePin before module.exports
    # First, add the PATCH case in the switch
    if "'PATCH':" not in content and '"PATCH":' not in content:
        # Add PATCH case before DELETE
        old = "case 'DELETE':"
        new = """      case 'PATCH':
        if (!requireRole(user, 'super_admin', 'admin'))
          return res.status(403).json({ error: 'Forbidden' });
        return await togglePin(req, res, user, ip, ua);
      case 'DELETE':"""
        content = content.replace(old, new)
        print("Added PATCH case")
    
    # Add togglePin function after the last function (deleteAnnouncement)
    if 'async function togglePin' not in content:
        toggle_pin_func = """
async function togglePin(req, res, user, ip, ua) {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const parts = url.pathname.replace('/api/announcements', '').split('/').filter(Boolean);
  const id = parts[0];
  
  if (!id) return res.status(400).json({ error: 'ID required' });
  
  const existing = await query('SELECT * FROM announcements WHERE id = $1', [id]);
  if (existing.rows.length === 0) return res.status(404).json({ error: 'Pengumuman tidak ditemukan' });
  
  const newPinned = !existing.rows[0].is_pinned;
  
  if (newPinned) {
    const pinnedCount = await query('SELECT COUNT(*) FROM announcements WHERE is_pinned = true AND id != $1', [id]);
    if (parseInt(pinnedCount.rows[0].count) >= PINNED_LIMIT) {
      return res.status(400).json({ error: 'Maksimal ' + PINNED_LIMIT + ' pengumuman yang dapat di-pin' });
    }
  }
  
  const result = await query('UPDATE announcements SET is_pinned = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [newPinned, id]);
  
  await logAudit(user.id, 'TOGGLE_PIN_ANNOUNCEMENT', 'announcements', id, { is_pinned: newPinned }, ip, ua);
  
  return res.status(200).json({ message: newPinned ? 'Pengumuman di-pin' : 'Pengumuman di-unpin', announcement: result.rows[0] });
}
"""
        # Find the last closing brace of the last function or module.exports
        # Insert before the end of file
        if content.rstrip().endswith('}'):
            # Remove trailing whitespace/newlines and add the function
            content = content.rstrip()
            content = content[:-1] + '\n' + toggle_pin_func + '\n};'
            print("Added togglePin function")
    
    with open(path, 'w') as f:
        f.write(content)
    
    print("File written successfully")

with open(path, 'r') as f:
    content = f.read()
print(f"Final size: {len(content)}")
print(f"Has togglePin: {'togglePin' in content}")
print(f"Has PATCH case: {'PATCH' in content}")
