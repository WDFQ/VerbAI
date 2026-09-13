type SessionDetailPageProps = {
    params: { id: string };
};

export default async function SessionDetailsPage({ params }: SessionDetailPageProps) {
    const { id } = params;

    //Fetch the specific session using the id
    // const response = ;
    // const session = await response.json();

    // return (
    //     <div className="flex flex-col h-full p-4">
    //         <h1 className="font-bold text-lg">{session.label}</h1>
    //     </div>
    // );
}