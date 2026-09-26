"use client";

import { useState } from "react";
import { Knowledge } from "../../lib/quote-engine";
import { Modal } from "./Modal";

export function KnowledgePage({
  knowledge,
  setKnowledge,
}: {
  knowledge: Knowledge[];
  setKnowledge: (x: Knowledge[]) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
        <div>
          <div className="badge">AI KNOWLEDGE BASE</div>
          <h2 className="hero text-3xl">Kho kiến thức.</h2>
          <p className="muted mt-2">Quy tắc kinh doanh và hướng dẫn cho AI.</p>
        </div>
        <button className="primary shrink-0" onClick={() => setShow(true)}>
          ＋ Thêm kiến thức
        </button>
      </div>
      <div className="card divide-y">
        {knowledge.length === 0 ? (
          <div className="p-16 text-center muted">Kho kiến thức đang trống.</div>
        ) : (
          knowledge.map((k) => (
            <div className="p-5 flex gap-4" key={k.id}>
              <button
                onClick={() =>
                  setKnowledge(
                    knowledge.map((x) =>
                      x.id === k.id ? { ...x, enabled: !x.enabled } : x
                    )
                  )
                }
                className={k.enabled ? "status-on" : "status-off"}
              >
                {k.enabled ? "BẬT" : "TẮT"}
              </button>
              <div className="flex-1 min-w-0">
                <b>{k.title}</b>
                <div className="text-sm text-[#687282] mt-1 whitespace-pre-wrap">{k.content}</div>
              </div>
              <button
                className="text-xs text-red-500 shrink-0"
                onClick={() => setKnowledge(knowledge.filter((x) => x.id !== k.id))}
              >
                Xóa
              </button>
            </div>
          ))
        )}
      </div>
      {show && (
        <KnowledgeModal
          onClose={() => setShow(false)}
          onSave={(k) => {
            setKnowledge([...knowledge, k]);
            setShow(false);
          }}
        />
      )}
    </div>
  );
}

function KnowledgeModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (k: Knowledge) => void;
}) {
  const [t, setT] = useState("");
  const [c, setC] = useState("");
  return (
    <Modal title="Thêm kiến thức cho AI" onClose={onClose}>
      <input className="field mb-3" value={t} onChange={(e) => setT(e.target.value)} placeholder="Tên quy tắc" />
      <textarea className="field min-h-[150px]" value={c} onChange={(e) => setC(e.target.value)} placeholder="Nội dung quy tắc..." />
      <button
        className="primary w-full mt-3"
        onClick={() =>
          t &&
          c &&
          onSave({
            id: crypto.randomUUID(),
            title: t,
            content: c,
            enabled: true,
            createdAt: new Date().toISOString(),
          })
        }
      >
        Lưu kiến thức
      </button>
    </Modal>
  );
}
