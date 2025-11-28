import React, { useEffect, useState } from "react";
import { getReviews, markReviewHelpful, flagReview, replyToReview } from "@/api";
import ReviewForm from "./ReviewForm";
import { useSelector } from "react-redux";

type Props = {
  entityType: "HOTEL" | "FLIGHT";
  entityId: string;
};

export default function ReviewList({ entityType, entityId }: Props) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [sort, setSort] = useState<"helpful"|"recent">("helpful");
  const [loading, setLoading] = useState(true);
  const user = useSelector((state:any) => state.user.user);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getReviews({ entityType, entityId, sort });
      setReviews(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [entityType, entityId, sort]);

  const handleHelpful = async (reviewId: string) => {
    try {
      await markReviewHelpful({ reviewId, userId: user?.id || user?._id });
      await load();
    } catch (err) { console.error(err); }
  };

  const handleFlag = async (reviewId: string) => {
    const reason = prompt("Why are you flagging this review?");
    if (!reason) return;
    try {
      await flagReview({ reviewId, reason });
      alert("Flag submitted");
    } catch (err) { console.error(err); alert("Failed to flag"); }
  };

  const handleReply = async (reviewId: string, text: string) => {
    try {
      await replyToReview({ reviewId, userId: user?.id || user?._id, text });
      await load();
    } catch (err) { console.error(err); alert("Failed to reply"); }
  };

  if (loading) return <div>Loading reviews…</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Reviews</h3>
        <div>
          <label className="mr-2 text-sm">Sort:</label>
          <select value={sort} onChange={e => setSort(e.target.value as any)} className="border rounded p-1">
            <option value="helpful">Most helpful</option>
            <option value="recent">Most recent</option>
          </select>
        </div>
      </div>

      <ReviewForm entityType={entityType} entityId={entityId} userId={user?.id || user?._id} onPosted={(r)=>setReviews(prev=>[r,...prev])} />

      <div className="space-y-4">
        {reviews.length === 0 && <div className="text-gray-600">No reviews yet — be the first to review!</div>}
        {reviews.map((r) => (
          <div key={r.id} className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">User: {r.userId}</div>
                <div className="text-sm text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</div>
                <div className="text-sm text-gray-600">{new Date(r.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="font-bold">Helpful: {r.helpfulCount}</div>
                <div className="text-sm text-red-600">Flags: {r.flags}</div>
              </div>
            </div>

            <div className="mt-3 text-gray-700">{r.text}</div>

            {r.photos && r.photos.length > 0 && (
              <div className="mt-3 flex gap-2">
                {r.photos.map((p:string, i:number) => (
                  <img key={i} src={p} alt="review" className="w-24 h-24 object-cover rounded" />
                ))}
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <button className="text-sm px-2 py-1 border rounded" onClick={()=>handleHelpful(r.id)}>Helpful</button>
              <button className="text-sm px-2 py-1 border rounded" onClick={()=>handleFlag(r.id)}>Flag</button>
              <ReplyBox onReply={(text)=>handleReply(r.id,text)} />
            </div>

            {/* Replies */}
            {r.replies && r.replies.length > 0 && (
              <div className="mt-3 border-t pt-3 space-y-2">
                {r.replies.map((rep:any) => (
                  <div key={rep.id} className="text-sm">
                    <div className="font-semibold text-sm">{rep.userId} <span className="text-gray-400 text-xs">{new Date(rep.createdAt).toLocaleString()}</span></div>
                    <div className="text-gray-700">{rep.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReplyBox({ onReply } : { onReply: (text:string) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  return (
    <div>
      {!open ? <button className="px-2 py-1 border rounded text-sm" onClick={()=>setOpen(true)}>Reply</button> :
        <div className="flex gap-2">
          <input value={text} onChange={e=>setText(e.target.value)} className="border rounded p-1" />
          <button className="px-2 py-1 bg-blue-600 text-white rounded text-sm" onClick={()=>{ onReply(text); setText(""); setOpen(false); }}>Send</button>
          <button className="px-2 py-1 border rounded text-sm" onClick={()=>{ setText(""); setOpen(false); }}>Cancel</button>
        </div>
      }
    </div>
  );
}
