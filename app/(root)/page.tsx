import ThreadCard from "@/components/cards/ThreadCard";
import { fetchPosts } from "@/lib/actions/threads.actions";
import { currentUser } from "@clerk/nextjs";

async function Home() {
  const result = await fetchPosts(1, 30);
  const user = await currentUser();

  return (
    <div>
      {/* <UserButton afterSignOutUrl="/" /> */}
      <h1 className="head-text text-left">home</h1>
      <section className="mt-9 flex flex-col gap-10">
        {result.posts.length === 0 ? (
          <p className="no-result"> No Threads Found</p>
        ) : (
          <>
            {result.posts.map((post) => (
              <ThreadCard
                key={post._id}
                id={post._id}
                currentUserId={user?.id || ""}
                parentid={post.parentid}
                content={post.text}
                author={post.author}
                community={post.community}
                createdAt={post.createdAt}
                comments={post.children}
              />
            ))}
          </>
        )}
      </section>
    </div>
  );
}
export default Home;
