import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { FileText, Save } from 'lucide-react';

export function NotesCard() {
  const [notes, setNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState('');

  // Load notes from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('tripPlannerNotes');
    if (savedData) {
      setNotes(savedData);
      setSavedNotes(savedData);
    }
  }, []);

  const handleSave = () => {
    setSavedNotes(notes);
    localStorage.setItem('tripPlannerNotes', notes);
    console.log('Notes saved:', notes);
    alert('Notes saved successfully!');
  };

  const handleClear = () => {
    setNotes('');
    localStorage.removeItem('tripPlannerNotes');
    setSavedNotes('');
  };

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <FileText className="h-5 w-5 text-green-600" />
          Personal Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write your travel notes, reminders, or thoughts here..."
          className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
        />
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Notes
          </Button>
          <Button
            onClick={handleClear}
            variant="outline"
            className="flex-1"
          >
            Clear
          </Button>
        </div>
        {savedNotes && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-gray-600 font-semibold mb-2">Last Saved:</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{savedNotes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}