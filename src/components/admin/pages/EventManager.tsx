import { useState, useEffect, useCallback } from 'react';
import { colors, s } from '../shared/styles';
import { fetchEvents, createEvent, updateEvent, deleteEvent, uploadImage as uploadImageAsset } from '../adminClient';

function EventManager() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    title: '', description: '', linkUrl: '', order: 0,
    startDate: '', endDate: '', isActive: true,
  });
  const [imagePreview, setImagePreview] = useState('');
  const [imageAssetId, setImageAssetId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchEvents().then(setEvents).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm({ title: '', description: '', linkUrl: '', order: 0, startDate: '', endDate: '', isActive: true });
    setImagePreview('');
    setImageAssetId('');
    setEditing(null);
    setShowForm(false);
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (event: any) => {
    setEditing(event);
    setForm({
      title: event.title || '',
      description: event.description || '',
      linkUrl: event.linkUrl || '',
      order: event.order || 0,
      startDate: event.startDate ? event.startDate.slice(0, 16) : '',
      endDate: event.endDate ? event.endDate.slice(0, 16) : '',
      isActive: event.isActive ?? true,
    });
    setImagePreview(event.image?.asset?.url || '');
    setImageAssetId(event.image?.asset?._id || '');
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const asset = await uploadImageAsset(file);
      setImagePreview(asset.url || '');
      setImageAssetId(asset._id);
    } catch (err: any) {
      alert('업로드 실패: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!form.title) { alert('이벤트 제목을 입력하세요.'); return; }
    if (!form.startDate || !form.endDate) { alert('시작일과 종료일을 입력하세요.'); return; }

    const data: any = {
      title: form.title,
      description: form.description || undefined,
      linkUrl: form.linkUrl || undefined,
      order: Number(form.order) || 0,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      isActive: form.isActive,
    };
    if (imageAssetId) {
      data.image = { _type: 'image', asset: { _type: 'reference', _ref: imageAssetId } };
    }

    try {
      const wasEditing = !!editing;
      if (editing) {
        await updateEvent(editing._id, data);
      } else {
        await createEvent(data);
      }
      resetForm();
      load();
      alert(wasEditing ? '이벤트가 수정되었습니다.' : '이벤트가 추가되었습니다.');
    } catch (err: any) {
      alert('저장 실패: ' + err.message);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`"${title}" 이벤트를 삭제하시겠습니까?`)) {
      try {
        await deleteEvent(id);
        load();
      } catch (e) {
        alert('삭제에 실패했습니다.');
      }
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await updateEvent(id, { isActive: !current });
      load();
    } catch (e) {
      alert('상태 변경에 실패했습니다.');
    }
  };

  const isLive = (event: any) => {
    if (!event.startDate || !event.endDate) return false;
    const now = new Date();
    return new Date(event.startDate) <= now && now <= new Date(event.endDate);
  };

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>이벤트 관리</h1>
        <button onClick={openNew} style={{ ...s.btn, ...s.btnPrimary }}>+ 이벤트 추가</button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>{editing ? '이벤트 수정' : '새 이벤트 추가'}</h3>
            <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={s.label}>이벤트 제목 *</label>
              <input style={s.input} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="이벤트 제목" />
            </div>
            <div>
              <label style={s.label}>링크 URL</label>
              <input style={s.input} value={form.linkUrl} onChange={e => setForm(p => ({ ...p, linkUrl: e.target.value }))} placeholder="https://..." />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={s.label}>설명</label>
              <textarea style={{ ...s.textarea, minHeight: 80 }} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="이벤트 설명" />
            </div>
            <div>
              <label style={s.label}>시작일 *</label>
              <input type="datetime-local" style={s.input} value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
            </div>
            <div>
              <label style={s.label}>종료일 *</label>
              <input type="datetime-local" style={s.input} value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
            </div>
            <div>
              <label style={s.label}>표시 순서</label>
              <input type="number" style={s.input} value={form.order} onChange={e => setForm(p => ({ ...p, order: Number(e.target.value) }))} />
            </div>
          </div>

          {/* Image Upload */}
          <div style={{ marginTop: 16 }}>
            <label style={s.label}>이미지</label>
            {imagePreview && <img src={imagePreview} alt="미리보기" style={{ width: 200, height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 8, display: 'block' }} />}
            <label style={{ ...s.btn, ...s.btnOutline, display: 'inline-block', cursor: uploading ? 'wait' : 'pointer' }}>
              {uploading ? '업로드 중...' : imagePreview ? '이미지 변경' : '이미지 선택'}
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>
          </div>

          {/* Active Toggle + Save */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
              활성화
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={resetForm} style={{ ...s.btn, ...s.btnOutline }}>취소</button>
              <button onClick={handleSave} style={{ ...s.btn, ...s.btnPrimary }}>{editing ? '수정' : '추가'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Event List */}
      {loading ? <p style={{ textAlign: 'center', color: colors.textLight, padding: 40 }}>로딩 중...</p> : (
        <div style={s.card}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>제목</th>
                <th style={s.th}>기간</th>
                <th style={s.th}>상태</th>
                <th style={s.th}>활성</th>
                <th style={s.th}>순서</th>
                <th style={s.th}>관리</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event: any) => (
                <tr key={event._id}>
                  <td style={{ ...s.td, fontWeight: 600 }}>{event.title}</td>
                  <td style={{ ...s.td, fontSize: 11, color: colors.textLight }}>
                    {event.startDate ? new Date(event.startDate).toLocaleDateString('ko') : ''} ~ {event.endDate ? new Date(event.endDate).toLocaleDateString('ko') : ''}
                  </td>
                  <td style={s.td}>
                    {isLive(event) ? (
                      <span style={{ ...s.badge, background: '#dcfce7', color: colors.green }}>진행중</span>
                    ) : new Date(event.endDate) < new Date() ? (
                      <span style={{ ...s.badge, background: '#f3f4f6', color: '#6b7280' }}>종료</span>
                    ) : (
                      <span style={{ ...s.badge, background: '#dbeafe', color: colors.blue }}>예정</span>
                    )}
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: event.isActive ? '#dcfce7' : '#fee2e2', color: event.isActive ? colors.green : colors.red, cursor: 'pointer' }}
                      onClick={() => toggleActive(event._id, event.isActive)}>
                      {event.isActive ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td style={{ ...s.td, fontSize: 12 }}>{event.order ?? 0}</td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(event)} style={{ fontSize: 11, color: colors.blue, background: 'none', border: 'none', cursor: 'pointer' }}>수정</button>
                      <button onClick={() => handleDelete(event._id, event.title)} style={{ fontSize: 11, color: colors.red, background: 'none', border: 'none', cursor: 'pointer' }}>삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
              {events.length === 0 && <tr><td colSpan={6} style={{ ...s.td, textAlign: 'center', color: colors.textLight, padding: 40 }}>등록된 이벤트가 없습니다</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default EventManager;
