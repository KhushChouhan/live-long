export async function POST(request) {
  try {
    const body = await request.json();

    const response = await fetch(
      'https://uat.live-long.app/user/login?_format=json',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    )

    const data = await response.json();
    console.log(data)

    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    return Response.json({ message: error.message || 'Internal API Error' }, { status: 500 });
  }
}
