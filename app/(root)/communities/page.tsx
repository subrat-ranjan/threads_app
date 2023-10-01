import CommunityCard from "@/components/cards/CommunityCard";
import UserCard from "@/components/cards/UserCard";
import Pagination from "@/components/shared/Pagination";
import ProfileHeader from "@/components/shared/ProfileHeader";
import Searchbar from "@/components/shared/Searchbar";
import ThreadsTab from "@/components/shared/ThreadsTab";

import { profileTabs } from "@/constants";
import { fetchCommunities } from "@/lib/actions/community.actions";
import { fetchUser, fetchUsers } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs";

import Image from "next/image";
import { redirect, useSearchParams } from "next/navigation";

async function Page({ searchParams }: { searchParams: { [key: string]: string | undefined } }) {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  //Fetch fetchCommunities
  const result = await fetchCommunities({
    searchString: searchParams.q,
    pageNumber: searchParams?.page ? +searchParams.page : 1,
    pageSize: 25,
  });

  return (
    <>
      <h1 className="head-text"> Communities</h1>
      <div className="mt-5">
        <Searchbar routeType="communities" />
      </div>
      <section className="mt-9 flex flex-wrap gap-4">
        {result.communities.length === 0 ? (
          <p className="no-result">No communities</p>
        ) : (
          <>
            {result.communities.map((community) => (
              <CommunityCard
                key={community.id}
                id={community.id}
                name={community.name}
                username={community.username}
                imgUrl={community.image}
                bio={community.bio}
                members={community.members}
              />
            ))}
          </>
        )}
      </section>
      <Pagination path="communities" pageNumber={searchParams?.page ? +searchParams.page : 1} isNext={result.isNext} />
    </>
  );
}

export default Page;
