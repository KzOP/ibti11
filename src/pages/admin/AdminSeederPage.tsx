import { useState, useRef } from "react";
import {
  Database, Play, Upload, RefreshCw, CheckCircle2, XCircle,
  AlertCircle, FileJson, FileText, Info, Globe, Building2,
} from "lucide-react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  runAutoSeed, seedUniversities, getFirestoreCount,
  getSeedMeta, parseCSV, parseJSON, type SeederResult,
} from "@/lib/seeder";

export default function AdminSeederPage() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [running, setRunning] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [result, setResult] = useState<SeederResult | null>(null);
  const [firestoreCount, setFirestoreCount] = useState<number | null>(null);
  const [importMode, setImportMode] = useState<"json" | "csv" | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [fileError, setFileError] = useState("");

  const meta = getSeedMeta();

  const loadCount = async () => {
    const count = await getFirestoreCount();
    setFirestoreCount(count);
  };

  const handleAutoSeed = async () => {
    setRunning(true);
    setResult(null);
    setProgress(0);

    try {
      const res = await runAutoSeed({
        updateExisting,
        onProgress: (current, total, name) => {
          setProgress(Math.round((current / total) * 100));
          setProgressLabel(name);
        },
      });
      setResult(res);
      await loadCount();
      toast({
        title: "اكتمل البذر التلقائي",
        description: `تمت إضافة ${res.added} جامعة، تحديث ${res.updated}`,
      });
    } catch (e: unknown) {
      toast({
        title: "خطأ",
        description: e instanceof Error ? e.message : "فشل البذر التلقائي",
        variant: "destructive",
      });
    } finally {
      setRunning(false);
      setProgress(0);
      setProgressLabel("");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError("");

    const text = await file.text();
    let parsed: any[] = [];

    if (file.name.endsWith(".json")) {
      parsed = parseJSON(text);
      setImportMode("json");
    } else if (file.name.endsWith(".csv")) {
      parsed = parseCSV(text);
      setImportMode("csv");
    } else {
      setFileError("صيغة غير مدعومة. استخدم JSON أو CSV.");
      return;
    }

    if (parsed.length === 0) {
      setFileError("لم يتم العثور على بيانات صالحة في الملف.");
      return;
    }
    setImportPreview(parsed);
    e.target.value = "";
  };

  const handleImport = async () => {
    if (importPreview.length === 0) return;
    setRunning(true);
    setResult(null);
    setProgress(0);

    try {
      const res = await seedUniversities(importPreview, {
        updateExisting,
        onProgress: (current, total, name) => {
          setProgress(Math.round((current / total) * 100));
          setProgressLabel(name);
        },
      });
      setResult(res);
      setImportPreview([]);
      setImportMode(null);
      await loadCount();
      toast({
        title: "اكتمل الاستيراد",
        description: `تمت إضافة ${res.added} جامعة، تحديث ${res.updated}`,
      });
    } catch (e: unknown) {
      toast({
        title: "خطأ في الاستيراد",
        description: e instanceof Error ? e.message : "فشل الاستيراد",
        variant: "destructive",
      });
    } finally {
      setRunning(false);
      setProgress(0);
      setProgressLabel("");
    }
  };

  return (
    <Layout title="البذر التلقائي للجامعات">
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6" dir="rtl">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Database size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">البذر التلقائي للجامعات</h2>
            <p className="text-sm text-muted-foreground">استيراد وتحديث بيانات الجامعات من مصادر متعددة</p>
          </div>
          <div className="mr-auto">
            <Button variant="outline" size="sm" onClick={loadCount} className="gap-1.5">
              <RefreshCw size={13} />
              تحديث العدد
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "إجمالي البيانات الجاهزة", value: meta.totalCount, icon: Database, color: "text-primary" },
            { label: "جامعات سعودية", value: meta.saudiCount, icon: Building2, color: "text-green-600" },
            { label: "جامعات دولية", value: meta.internationalCount, icon: Globe, color: "text-blue-600" },
            { label: "في Firestore الآن", value: firestoreCount ?? "—", icon: CheckCircle2, color: "text-orange-600" },
          ].map((s, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4 flex flex-col gap-1">
                <s.icon size={16} className={s.color} />
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Options */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">خيارات الاستيراد</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Switch
                id="update-existing"
                checked={updateExisting}
                onCheckedChange={setUpdateExisting}
                disabled={running}
              />
              <Label htmlFor="update-existing" className="cursor-pointer">
                <span className="font-medium text-sm">تحديث الجامعات الموجودة</span>
                <p className="text-xs text-muted-foreground">إذا كانت الجامعة موجودة يتم تحديث بياناتها بدون حذفها</p>
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Auto Seed */}
        <Card className="border-0 shadow-sm border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Play size={16} className="text-primary" />
                البذر التلقائي
              </CardTitle>
              <div className="flex gap-1.5">
                <Badge variant="outline" className="text-xs">{meta.saudiCount} سعودية</Badge>
                <Badge variant="outline" className="text-xs">{meta.internationalCount} دولية</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <Info size={14} className="text-blue-600" />
              <AlertDescription className="text-blue-700 text-xs">
                يتضمن بيانات حقيقية لـ {meta.totalCount} جامعة. البيانات غير المؤكدة مُعلَّمة بـ "يحتاج مراجعة".
                لا تحتوي على نسب قبول وهمية أو موزونيات غير مؤكدة.
              </AlertDescription>
            </Alert>

            {running && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{progressLabel || "جاري المعالجة..."}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <Button
              onClick={handleAutoSeed}
              disabled={running}
              className="w-full gap-2"
            >
              {running ? (
                <><RefreshCw size={14} className="animate-spin" />جاري البذر...</>
              ) : (
                <><Play size={14} />ابدأ البذر التلقائي ({meta.totalCount} جامعة)</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* File Import */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload size={16} className="text-primary" />
              استيراد ملف (CSV / JSON)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => fileRef.current?.click()}>
                <FileJson size={24} className="text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-medium">ملف JSON</p>
                <p className="text-xs text-muted-foreground">مصفوفة من كائنات الجامعات</p>
              </div>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => fileRef.current?.click()}>
                <FileText size={24} className="text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium">ملف CSV</p>
                <p className="text-xs text-muted-foreground">صفوف مع رؤوس أعمدة</p>
              </div>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".json,.csv"
              onChange={handleFileChange}
              className="hidden"
            />

            {fileError && (
              <Alert variant="destructive" className="text-xs">
                <XCircle size={13} />
                <AlertDescription>{fileError}</AlertDescription>
              </Alert>
            )}

            {importPreview.length > 0 && (
              <div className="space-y-3">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 size={13} className="text-green-600" />
                  <AlertDescription className="text-green-700 text-xs">
                    تم قراءة {importPreview.length} جامعة من الملف.
                    تحقق من البيانات قبل الاستيراد.
                  </AlertDescription>
                </Alert>

                <div className="max-h-40 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                  {importPreview.slice(0, 10).map((u, i) => (
                    <div key={i} className="px-3 py-2 flex items-center gap-2 text-xs">
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {u.type === "local" ? "سعودية" : "دولية"}
                      </Badge>
                      <span className="truncate text-foreground">{u.nameAr || u.nameEn}</span>
                      <span className="text-muted-foreground shrink-0">{u.country}</span>
                    </div>
                  ))}
                  {importPreview.length > 10 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                      + {importPreview.length - 10} جامعة أخرى
                    </div>
                  )}
                </div>

                {running && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{progressLabel}</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleImport} disabled={running} className="flex-1 gap-1.5">
                    {running ? <><RefreshCw size={13} className="animate-spin" />جاري الاستيراد...</> : <><Upload size={13} />استيراد {importPreview.length} جامعة</>}
                  </Button>
                  <Button variant="outline" onClick={() => { setImportPreview([]); setImportMode(null); }} disabled={running}>
                    إلغاء
                  </Button>
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 rounded-lg p-3">
              <p className="font-medium text-foreground">تنسيق CSV المطلوب:</p>
              <code className="block font-mono text-[10px] bg-background rounded px-2 py-1">
                nameAr,nameEn,country,city,type,majors,websiteUrl,admissionUrl,suitableForSaudiScholarship,needsReview
              </code>
              <p className="font-medium text-foreground mt-2">تنسيق JSON المطلوب:</p>
              <code className="block font-mono text-[10px] bg-background rounded px-2 py-1">
                {`[{"nameAr":"...", "nameEn":"...", "country":"...", "type":"international"}]`}
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {result.failed === 0 ? (
                  <CheckCircle2 size={16} className="text-green-600" />
                ) : (
                  <AlertCircle size={16} className="text-amber-600" />
                )}
                نتائج العملية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
                {[
                  { label: "الإجمالي", value: result.total, color: "text-foreground" },
                  { label: "مُضاف", value: result.added, color: "text-green-600" },
                  { label: "مُحدَّث", value: result.updated, color: "text-blue-600" },
                  { label: "مُتخَطى", value: result.skipped, color: "text-amber-600" },
                  { label: "فشل", value: result.failed, color: "text-red-600" },
                ].map((s, i) => (
                  <div key={i} className="text-center p-3 rounded-lg bg-muted/50">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              {result.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1">
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-destructive">{e}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
