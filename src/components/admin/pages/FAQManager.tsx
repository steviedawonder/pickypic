import { useState, useEffect, useCallback } from 'react';
import { colors, s } from '../shared/styles';
import { fetchFAQItems, createFAQItem, updateFAQItem, deleteFAQItem, triggerRebuild } from '../adminClient';

function FAQManager() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ question: '', answer: '', page: 'home' });
  const [editId, setEditId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchFAQItems().then(setItems).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.question || !form.answer) { alert('질문과 답변을 모두 입력해주세요.'); return; }
    try {
      if (editId) {
        await updateFAQItem(editId, form);
      } else {
        await createFAQItem({ ...form, order: items.length });
      }
      setForm({ question: '', answer: '', page: 'home' });
      setEditId(null);
      load();
      triggerRebuild();
    } catch (e) {
      alert('저장에 실패했습니다.');
    }
  };

  const handleEdit = (item: any) => {
    setEditId(item._id);
    setForm({ question: item.question, answer: item.answer, page: item.page });
  };

  const handleDelete = async (id: string) => {
    if (confirm('이 FAQ를 삭제하시겠습니까?')) {
      try {
        await deleteFAQItem(id);
        load();
        triggerRebuild();
      } catch (e) {
        alert('삭제에 실패했습니다.');
      }
    }
  };

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>FAQ 관리</h1>
      </div>

      <div style={s.card}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>{editId ? '✏️ FAQ 수정' : '➕ 새 FAQ 추가'}</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
            <div>
              <label style={s.label}>질문</label>
              <input style={s.input} value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} placeholder="자주 묻는 질문을 입력하세요" />
            </div>
            <div>
              <label style={s.label}>페이지</label>
              <select style={s.input} value={form.page} onChange={e => setForm(p => ({ ...p, page: e.target.value }))}>
                <option value="home">홈페이지</option>
                <option value="rental">렌탈문의</option>
                <option value="products">제품소개</option>
              </select>
            </div>
          </div>
          <div>
            <label style={s.label}>답변</label>
            <textarea style={s.textarea} value={form.answer} onChange={e => setForm(p => ({ ...p, answer: e.target.value }))} placeholder="답변을 작성하세요" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSave} style={{ ...s.btn, ...s.btnPrimary }}>{editId ? '수정 완료' : '추가'}</button>
            {editId && <button onClick={() => { setEditId(null); setForm({ question: '', answer: '', page: 'home' }); }} style={{ ...s.btn, ...s.btnOutline }}>취소</button>}
          </div>
        </div>
      </div>

      {loading ? <p style={{ color: colors.textLight, padding: 40 }}>로딩 중...</p> : (
        ['home', 'rental', 'products'].map(page => {
          const pageItems = items.filter((i: any) => i.page === page);
          if (pageItems.length === 0) return null;
          const pageLabels: Record<string, string> = { home: '🏠 홈페이지', rental: '📋 렌탈문의', products: '📦 제품소개' };
          return (
            <div key={page} style={{ ...s.card, marginTop: 8 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{pageLabels[page] || page} FAQ ({pageItems.length}개)</h3>
              {pageItems.map((item: any, i: number) => (
                <div key={item._id} style={{ padding: '12px 0', borderBottom: i < pageItems.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Q. {item.question}</p>
                      <p style={{ fontSize: 12, color: colors.textLight, lineHeight: 1.5 }}>A. {item.answer}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                      <button onClick={() => handleEdit(item)} style={{ ...s.btn, ...s.btnOutline, padding: '4px 10px', fontSize: 11 }}>수정</button>
                      <button onClick={() => handleDelete(item._id)} style={{ ...s.btn, ...s.btnDanger, padding: '4px 10px', fontSize: 11 }}>삭제</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}

export default FAQManager;
