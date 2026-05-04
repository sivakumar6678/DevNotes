export default function UploadGuide() {
  const steps = [
    { title: "Write content", description: "Write or gather your raw notes, documentation, or Notion pages." },
    { title: "Convert content into JSON using AI", description: "Use the provided sample prompt to convert your raw content into the required JSON structure." },
    { title: "Select version type", description: "Choose the appropriate version (e.g., Industry, Interview) from the dropdown in the editor header." },
    { title: "Paste JSON into editor", description: "Paste the generated JSON into the left-side editor panel." },
    { title: "Preview content", description: "Toggle to the Preview tab to ensure the formatting and layout look correct." },
    { title: "Save content", description: "Click the Save button in the header to store your draft." },
    { title: "Publish topic", description: "Once ready, click Publish to make the content visible to learners." },
  ]

  return (
    <div className="max-w-3xl mx-auto py-8 px-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">How to Upload Content</h1>
      <p className="text-slate-600 mb-8">Follow these steps to structure and upload your notes to the platform.</p>
      
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-100">
          {steps.map((step, index) => (
            <div key={index} className="p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 text-brand-orange flex items-center justify-center font-bold text-sm">
                {index + 1}
              </div>
              <div className="pt-1">
                <h3 className="text-sm font-bold text-slate-900 mb-1">{step.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
