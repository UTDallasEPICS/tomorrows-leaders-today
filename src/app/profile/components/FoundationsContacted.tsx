export function FoundationsContacted() {
      {/* Foundations Contacted Section */}
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Foundations Contacted</h2>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Gates Foundation</p>
                  <p className="text-sm text-gray-500">Education Initiative</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">Active</span>
              </div>
              <p className="mt-2 text-sm">Last contacted: 03/15/2023</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Ford Foundation</p>
                  <p className="text-sm text-gray-500">Social Justice Program</p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">Pending</span>
              </div>
              <p className="mt-2 text-sm">Last contacted: 04/01/2023</p>
            </div>
          </div>
        </div>
      );
}