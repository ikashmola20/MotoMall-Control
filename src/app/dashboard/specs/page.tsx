'use client';

import { useState } from 'react';
import { useAdminStore } from '@/lib/admin-store';
import { SpecTemplate, SpecField, SpecFieldType } from '@/types/admin';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Plus, Edit3, Trash2, Eye, ArrowUp, ArrowDown, Package } from 'lucide-react';

const fieldTypeLabels: Record<SpecFieldType, string> = {
  number: 'رقم',
  text: 'نص',
  select: 'قائمة',
  boolean: 'نعم/لا',
};

export default function SpecsPage() {
  const { specTemplates, products, addSpecTemplate, updateSpecTemplate, deleteSpecTemplate } = useAdminStore();
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SpecTemplate | null>(null);
  const [showFields, setShowFields] = useState<SpecTemplate | null>(null);
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState('');
  const [editingField, setEditingField] = useState<SpecField | null>(null);
  const [showAffected, setShowAffected] = useState<SpecTemplate | null>(null);

  const [templateForm, setTemplateForm] = useState({ name: '', icon: '🏍️' });
  const [fieldForm, setFieldForm] = useState<{ label: string; unit: string; type: SpecFieldType; options: string }>({
    label: '', unit: '', type: 'number', options: '',
  });

  const iconOptions = ['🏍️', '⚡', '🪖', '🔧', '🛵', '⚙️', '🔩', '🛡️', '📦', '🎯'];

  const getAffectedCount = (templateId: string) =>
    products.filter(p => p.specTemplateId === templateId).length;

  const openAddTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({ name: '', icon: '🏍️' });
    setShowForm(true);
  };

  const openEditTemplate = (t: SpecTemplate) => {
    setEditingTemplate(t);
    setTemplateForm({ name: t.name, icon: t.icon });
    setShowForm(true);
  };

  const handleSaveTemplate = () => {
    if (!templateForm.name) return;
    if (editingTemplate) {
      updateSpecTemplate({ ...editingTemplate, name: templateForm.name, icon: templateForm.icon, updatedAt: new Date().toISOString() });
    } else {
      addSpecTemplate({ id: `spec-${Date.now()}`, name: templateForm.name, icon: templateForm.icon, fields: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    setShowForm(false);
  };

  const openAddField = (templateId: string) => {
    setEditingField(null);
    setFieldForm({ label: '', unit: '', type: 'number', options: '' });
    setActiveTemplateId(templateId);
    setShowFieldForm(true);
  };

  const openEditField = (templateId: string, field: SpecField) => {
    setEditingField(field);
    setFieldForm({ label: field.label, unit: field.unit || '', type: field.type, options: field.options?.join(', ') || '' });
    setActiveTemplateId(templateId);
    setShowFieldForm(true);
  };

  const handleSaveField = () => {
    if (!fieldForm.label || !activeTemplateId) return;
    const template = specTemplates.find(t => t.id === activeTemplateId);
    if (!template) return;
    const newField: SpecField = {
      id: editingField?.id || `f-${Date.now()}`,
      label: fieldForm.label,
      unit: fieldForm.unit || undefined,
      type: fieldForm.type,
      options: fieldForm.type === 'select' && fieldForm.options ? fieldForm.options.split(',').map(o => o.trim()).filter(Boolean) : undefined,
    };
    const updatedFields = editingField
      ? template.fields.map(f => f.id === editingField.id ? newField : f)
      : [...template.fields, newField];
    updateSpecTemplate({ ...template, fields: updatedFields, updatedAt: new Date().toISOString() });
    setShowFieldForm(false);
    if (showFields?.id === template.id) setShowFields({ ...template, fields: updatedFields });
  };

  const handleDeleteField = (templateId: string, fieldId: string) => {
    const template = specTemplates.find(t => t.id === templateId);
    if (!template) return;
    const updated = { ...template, fields: template.fields.filter(f => f.id !== fieldId), updatedAt: new Date().toISOString() };
    updateSpecTemplate(updated);
    if (showFields?.id === templateId) setShowFields(updated);
  };

  const handleMoveField = (templateId: string, fieldId: string, dir: 'up' | 'down') => {
    const template = specTemplates.find(t => t.id === templateId);
    if (!template) return;
    const idx = template.fields.findIndex(f => f.id === fieldId);
    const newIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= template.fields.length) return;
    const fields = [...template.fields];
    [fields[idx], fields[newIdx]] = [fields[newIdx], fields[idx]];
    const updated = { ...template, fields, updatedAt: new Date().toISOString() };
    updateSpecTemplate(updated);
    if (showFields?.id === templateId) setShowFields(updated);
  };

  return (
    <>
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
        <Button onClick={openAddTemplate}><Plus className="w-4 h-4" />إضافة قالب</Button>
        <span className="text-sm text-text-secondary">{specTemplates.length} قالب</span>
      </div>

      <div className="bg-bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-secondary/30">
                <th className="text-right py-3 px-4 text-text-secondary font-medium w-12"></th>
                <th className="text-right py-3 px-4 text-text-secondary font-medium">القالب</th>
                <th className="text-right py-3 px-4 text-text-secondary font-medium">الحقول</th>
                <th className="text-right py-3 px-4 text-text-secondary font-medium">المنتجات</th>
                <th className="text-right py-3 px-4 text-text-secondary font-medium">آخر تحديث</th>
                <th className="text-right py-3 px-4 text-text-secondary font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {specTemplates.map(t => {
                const affected = getAffectedCount(t.id);
                return (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-bg-secondary/30 transition-colors">
                    <td className="py-3 px-4"><span className="text-lg">{t.icon}</span></td>
                    <td className="py-3 px-4">
                      <p className="text-text-primary font-medium">{t.name}</p>
                    </td>
                    <td className="py-3 px-4 text-text-primary font-inter">
                      {t.fields.length} <span className="text-text-muted">حقل</span>
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => setShowAffected(t)} className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors">
                        <Package className="w-3.5 h-3.5 text-text-muted" />
                        <span className={`font-inter ${affected > 0 ? 'text-warning' : 'text-text-muted'}`}>{affected}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-text-muted text-xs font-inter">
                      {new Date(t.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setShowFields(t)} className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors" title="عرض الحقول"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openEditTemplate(t)} className="p-1.5 rounded-lg text-text-muted hover:text-warning hover:bg-warning/10 transition-colors"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => { if (confirm(`حذف "${t.name}"؟${affected > 0 ? ` يوجد ${affected} منتج يستخدمه!` : ''}`)) deleteSpecTemplate(t.id); }}
                          className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {specTemplates.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-text-muted">لا توجد قوالب بعد</td></tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      </div>

      <Modal isOpen={!!showFields} onClose={() => setShowFields(null)} title={`${showFields?.icon || ''} حقول ${showFields?.name || ''}`} size="xl">
        {showFields && (() => {
          const template = specTemplates.find(t => t.id === showFields.id) || showFields;
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">{template.fields.length} حقل</span>
                <Button size="sm" onClick={() => openAddField(template.id)}><Plus className="w-3.5 h-3.5" />حقل جديد</Button>
              </div>

              {template.fields.length === 0 ? (
                <div className="text-center py-8">
                  {/* eslint-disable react/no-unescaped-entities */}
                  <p className="text-sm text-text-muted">لا توجد حقول بعد</p>
                  <p className="text-xs text-text-muted mt-1">اضغط "حقل جديد" لإضافة أول حقل</p>
                  {/* eslint-enable react/no-unescaped-entities */}
                </div>
              ) : (
                <div className="bg-bg-secondary rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-right py-2.5 px-3 text-text-muted font-medium w-16">الترتيب</th>
                        <th className="text-right py-2.5 px-3 text-text-muted font-medium">اسم الحقل</th>
                        <th className="text-right py-2.5 px-3 text-text-muted font-medium">النوع</th>
                        <th className="text-right py-2.5 px-3 text-text-muted font-medium">الوحدة</th>
                        <th className="text-right py-2.5 px-3 text-text-muted font-medium w-20">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {template.fields.map((field, idx) => (
                        <tr key={field.id} className="border-b border-border/50 hover:bg-bg-card/50 transition-colors">
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-0.5">
                              <button onClick={() => handleMoveField(template.id, field.id, 'up')} disabled={idx === 0}
                                className="p-0.5 text-text-muted hover:text-text-primary disabled:opacity-20 transition-colors"><ArrowUp className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleMoveField(template.id, field.id, 'down')} disabled={idx === template.fields.length - 1}
                                className="p-0.5 text-text-muted hover:text-text-primary disabled:opacity-20 transition-colors"><ArrowDown className="w-3.5 h-3.5" /></button>
                              <span className="text-xs text-text-muted font-inter mr-1">{idx + 1}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <p className="text-text-primary">{field.label}</p>
                            {field.options && <p className="text-[10px] text-text-muted mt-0.5">{field.options.join(' • ')}</p>}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-md text-xs ${
                              field.type === 'number' ? 'bg-blue-500/10 text-blue-400' :
                              field.type === 'text' ? 'bg-purple-500/10 text-purple-400' :
                              field.type === 'select' ? 'bg-amber-500/10 text-amber-400' :
                              'bg-emerald-500/10 text-emerald-400'
                            }`}>{fieldTypeLabels[field.type]}</span>
                          </td>
                          <td className="py-2 px-3 text-text-muted font-inter">{field.unit || '-'}</td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-0.5">
                              <button onClick={() => openEditField(template.id, field)} className="p-1 rounded text-text-muted hover:text-accent transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => { if (confirm(`حذف "${field.label}"؟`)) handleDeleteField(template.id, field.id); }}
                                className="p-1 rounded text-text-muted hover:text-danger transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      <Modal isOpen={!!showAffected} onClose={() => setShowAffected(null)} title={`المنتجات المتأثرة — ${showAffected?.icon || ''} ${showAffected?.name || ''}`}>
        {showAffected && (() => {
          const affected = products.filter(p => p.specTemplateId === showAffected.id);
          return affected.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-6">لا توجد منتجات تستخدم هذا القالب</p>
          ) : (
            <div className="bg-bg-secondary rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right py-2.5 px-3 text-text-muted font-medium">المنتج</th>
                    <th className="text-right py-2.5 px-3 text-text-muted font-medium">البراند</th>
                    <th className="text-right py-2.5 px-3 text-text-muted font-medium">المواصفات</th>
                  </tr>
                </thead>
                <tbody>
                  {affected.map(p => (
                    <tr key={p.id} className="border-b border-border/50">
                      <td className="py-2.5 px-3 text-text-primary">{p.name}</td>
                      <td className="py-2.5 px-3 text-text-secondary">{p.brandName}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-xs px-2 py-0.5 rounded-lg ${p.specs ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                          {p.specs ? 'مكتملة' : 'ناقصة'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </Modal>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingTemplate ? 'تعديل القالب' : 'إضافة قالب جديد'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">اسم القالب *</label>
            <input type="text" value={templateForm.name} onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
              className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent"
              placeholder="مثال: دراجات نارية" />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-2">الأيقونة</label>
            <div className="flex flex-wrap gap-2">
              {iconOptions.map(icon => (
                <button key={icon} onClick={() => setTemplateForm({ ...templateForm, icon })}
                  className={`w-10 h-10 rounded-xl border text-lg flex items-center justify-center transition-colors ${templateForm.icon === icon ? 'border-accent bg-accent/10' : 'border-border hover:bg-bg-secondary'}`}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSaveTemplate} disabled={!templateForm.name}>{editingTemplate ? 'حفظ' : 'إضافة'}</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>إلغاء</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showFieldForm} onClose={() => setShowFieldForm(false)} title={editingField ? 'تعديل الحقل' : 'حقل جديد'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">اسم الحقل *</label>
              <input type="text" value={fieldForm.label} onChange={e => setFieldForm({ ...fieldForm, label: e.target.value })}
                className="w-full bg-bg-secondary border border-border rounded-lg px-2.5 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                placeholder="سعة المحرك" />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">الوحدة</label>
              <input type="text" value={fieldForm.unit} onChange={e => setFieldForm({ ...fieldForm, unit: e.target.value })}
                className="w-full bg-bg-secondary border border-border rounded-lg px-2.5 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                placeholder="cc, HP, كم/س" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">النوع</label>
            <div className="flex gap-2">
              {(['number', 'text', 'select', 'boolean'] as SpecFieldType[]).map(type => (
                <button key={type} onClick={() => setFieldForm({ ...fieldForm, type })}
                  className={`flex-1 py-2 rounded-lg border text-xs transition-colors ${fieldForm.type === type ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:bg-bg-secondary'}`}>
                  {fieldTypeLabels[type]}
                </button>
              ))}
            </div>
          </div>
          {fieldForm.type === 'select' && (
            <div>
              <label className="block text-xs text-text-muted mb-1">الخيارات (بفواصل) *</label>
              <input type="text" value={fieldForm.options} onChange={e => setFieldForm({ ...fieldForm, options: e.target.value })}
                className="w-full bg-bg-secondary border border-border rounded-lg px-2.5 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                placeholder="صغير, متوسط, كبير" />
            </div>
          )}
          <div className="flex gap-3">
            <Button onClick={handleSaveField} disabled={!fieldForm.label}>{editingField ? 'حفظ' : 'إضافة'}</Button>
            <Button variant="secondary" onClick={() => setShowFieldForm(false)}>إلغاء</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
